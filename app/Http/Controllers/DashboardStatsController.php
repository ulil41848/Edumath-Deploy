<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardStatsController extends Controller
{
    private const COURSE_KEY = 'matematika-kelas-3';
    private const COURSE_NAME = 'Matematika Kelas 3';
    private const TOTAL_MATERIALS = 3;

    /**
     * Mengambil statistik dashboard untuk pengguna yang login.
     */
    public function show(Request $request)
    {
        $userId = $request->user()->id;
        $timezone = 'Asia/Jakarta';
        $today = Carbon::now($timezone)->toDateString();

        // Ambil tanggal aktivitas yang tercatat.
        $activityDates = DB::table('learning_activity_days')
            ->where('user_id', $userId)
            ->orderByDesc('activity_date')
            ->pluck('activity_date')
            ->map(fn ($date) => Carbon::parse($date, $timezone)->toDateString())
            ->unique()
            ->all();

        $activityLookup = array_fill_keys($activityDates, true);

        // Streak tetap berjalan jika aktivitas terakhir terjadi kemarin.
        $startDate = $today;

        if (!isset($activityLookup[$today])) {
            $startDate = Carbon::now($timezone)
                ->subDay()
                ->toDateString();
        }

        $dayStreak = 0;

        if (isset($activityLookup[$startDate])) {
            $day = Carbon::parse($startDate, $timezone);

            while (isset($activityLookup[$day->toDateString()])) {
                $dayStreak++;
                $day->subDay();
            }
        }

        // Kursus terakhir yang dibuka siswa.
        $lastVisit = DB::table('learning_course_visits')
            ->where('user_id', $userId)
            ->orderByDesc('last_opened_at')
            ->first();

        $courseKey = $lastVisit->course_key ?? self::COURSE_KEY;
        $semester = (int) ($lastVisit->semester ?? 1);

        $completedCount = DB::table('learning_progress')
            ->where('user_id', $userId)
            ->where('course_key', $courseKey)
            ->where('semester', $semester)
            ->count();

        $progressPercent = (int) round(
            ($completedCount / self::TOTAL_MATERIALS) * 100
        );

        // Hitung materi selesai untuk menentukan pencapaian.
        $totalCompleted = DB::table('learning_progress')
            ->where('user_id', $userId)
            ->count();

        $semester1Completed = DB::table('learning_progress')
            ->where('user_id', $userId)
            ->where('course_key', self::COURSE_KEY)
            ->where('semester', 1)
            ->count();

        $semester2Completed = DB::table('learning_progress')
            ->where('user_id', $userId)
            ->where('course_key', self::COURSE_KEY)
            ->where('semester', 2)
            ->count();

        // Daftar badge ditentukan oleh pencapaian nyata.
        $badges = [
            [
                'key' => 'first-material',
                'name' => 'Langkah Pertama',
                'description' => 'Menyelesaikan materi pertama.',
                'unlocked' => $totalCompleted >= 1,
            ],
            [
                'key' => 'three-materials',
                'name' => 'Rajin Belajar',
                'description' => 'Menyelesaikan minimal 3 materi.',
                'unlocked' => $totalCompleted >= 3,
            ],
            [
                'key' => 'semester-1',
                'name' => 'Tuntas Semester 1',
                'description' => 'Menyelesaikan semua materi Semester 1.',
                'unlocked' => $semester1Completed >= self::TOTAL_MATERIALS,
            ],
            [
                'key' => 'semester-2',
                'name' => 'Tuntas Semester 2',
                'description' => 'Menyelesaikan semua materi Semester 2.',
                'unlocked' => $semester2Completed >= self::TOTAL_MATERIALS,
            ],
            [
                'key' => 'streak-3',
                'name' => 'Konsisten 3 Hari',
                'description' => 'Belajar selama 3 hari berturut-turut.',
                'unlocked' => $dayStreak >= 3,
            ],
            [
                'key' => 'streak-7',
                'name' => 'Konsisten 7 Hari',
                'description' => 'Belajar selama 7 hari berturut-turut.',
                'unlocked' => $dayStreak >= 7,
            ],
        ];

        $unlockedBadgeCount = count(array_filter(
            $badges,
            fn ($badge) => $badge['unlocked']
        ));

        return response()->json([
            'day_streak' => $dayStreak,
            'last_course' => [
                'course_key' => $courseKey,
                'name' => self::COURSE_NAME,
                'semester' => $semester,
                'completed_count' => $completedCount,
                'total_count' => self::TOTAL_MATERIALS,
                'percent' => min(100, $progressPercent),
            ],
            'badge_count' => $unlockedBadgeCount,
            'badge_total' => count($badges),
            'badges' => $badges,
        ]);
    }

    /**
     * Mencatat kursus yang dibuka dan aktivitas belajar hari ini.
     */
    public function visitCourse(Request $request)
    {
        $data = $request->validate([
            'course_key' => 'required|string|in:matematika-kelas-3',
            'semester' => 'required|integer|in:1,2',
        ]);

        $userId = $request->user()->id;
        $now = Carbon::now('Asia/Jakarta');

        DB::transaction(function () use ($data, $userId, $now) {
            DB::table('learning_course_visits')->updateOrInsert(
                [
                    'user_id' => $userId,
                    'course_key' => $data['course_key'],
                    'semester' => (int) $data['semester'],
                ],
                [
                    'last_opened_at' => $now,
                    'updated_at' => $now,
                ]
            );

            DB::table('learning_activity_days')->updateOrInsert(
                [
                    'user_id' => $userId,
                    'activity_date' => $now->toDateString(),
                ],
                [
                    'updated_at' => $now,
                ]
            );
        });

        return response()->json([
            'message' => 'Aktivitas belajar berhasil dicatat.',
        ]);
    }
}
