<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AchievementController extends Controller
{
    private const TIMEZONE = 'Asia/Jakarta';

    private const COURSE_KEY = 'matematika-kelas-3';

    private const BOOKS = [
        'kisah-mahabharata' => 'Kisah Mahabharata',
        'fisika-dasar-semesta' => 'Fisika Dasar Semesta',
        'bahasa-sansekerta' => 'Bahasa Sansekerta',
        'babad-tanah-jawi' => 'Babad Tanah Jawi',
    ];

    /**
     * Menampilkan seluruh statistik dan lencana pengguna.
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $dates = DB::table('learning_activity_days')
            ->where('user_id', $userId)
            ->orderBy('activity_date')
            ->pluck('activity_date')
            ->map(fn ($date) => Carbon::parse(
                $date,
                self::TIMEZONE
            )->toDateString())
            ->unique()
            ->values()
            ->all();

        $dateLookup = array_fill_keys($dates, true);

        // Menghitung streak yang sedang berjalan.
        $today = Carbon::now(self::TIMEZONE)->toDateString();

        $startDate = isset($dateLookup[$today])
            ? $today
            : Carbon::now(self::TIMEZONE)
                ->subDay()
                ->toDateString();

        $currentStreak = 0;
        $cursor = Carbon::parse($startDate, self::TIMEZONE);

        while (isset($dateLookup[$cursor->toDateString()])) {
            $currentStreak++;
            $cursor->subDay();
        }

        // Menghitung streak terbaik agar lencana tetap diperoleh
        // meskipun streak saat ini terputus.
        $longestStreak = 0;
        $runningStreak = 0;
        $previousDate = null;

        foreach ($dates as $date) {
            $expectedPreviousDate = Carbon::parse(
                $date,
                self::TIMEZONE
            )->subDay()->toDateString();

            if ($previousDate === $expectedPreviousDate) {
                $runningStreak++;
            } else {
                $runningStreak = 1;
            }

            $longestStreak = max(
                $longestStreak,
                $runningStreak
            );

            $previousDate = $date;
        }

        $aiCount = $this->countActivities(
            $userId,
            'ai_question'
        );

        $studyCount = $this->countActivities(
            $userId,
            'study_session'
        );

        $bookCount = $this->countActivities(
            $userId,
            'book_read'
        );

        $categories = [
            [
                'key' => 'day_streak',
                'title' => 'Day Streak',
                'icon' => '🔥',
                'count' => $currentStreak,
                'record' => $longestStreak,
                'unit' => 'hari berturut-turut',
                'badges' => $this->makeBadges(
                    'day-streak',
                    [
                        ['threshold' => 10, 'name' => 'Streak 10 Hari'],
                        ['threshold' => 30, 'name' => 'Streak 30 Hari'],
                        ['threshold' => 100, 'name' => 'Streak 100 Hari'],
                        ['threshold' => 1000, 'name' => 'Streak 1.000 Hari'],
                    ],
                    $longestStreak
                ),
            ],
            [
                'key' => 'ask_ai',
                'title' => 'Tanya AI',
                'icon' => '🤖',
                'count' => $aiCount,
                'record' => $aiCount,
                'unit' => 'pertanyaan',
                'badges' => $this->makeBadges(
                    'ask-ai',
                    [
                        ['threshold' => 1, 'name' => 'Penanya Pemula'],
                        ['threshold' => 100, 'name' => 'Penanya Aktif'],
                        ['threshold' => 500, 'name' => 'Ahli EduBot'],
                        ['threshold' => 1000, 'name' => 'Master EduBot'],
                    ],
                    $aiCount
                ),
            ],
            [
                'key' => 'study',
                'title' => 'Belajar',
                'icon' => '📚',
                'count' => $studyCount,
                'record' => $studyCount,
                'unit' => 'aktivitas belajar',
                'badges' => $this->makeBadges(
                    'study',
                    [
                        ['threshold' => 1, 'name' => 'Mulai Belajar'],
                        ['threshold' => 7, 'name' => 'Tekun Belajar'],
                        ['threshold' => 50, 'name' => 'Pejuang Ilmu'],
                        ['threshold' => 100, 'name' => 'Master Belajar'],
                    ],
                    $studyCount
                ),
            ],
            [
                'key' => 'reading',
                'title' => 'Membaca',
                'icon' => '📖',
                'count' => $bookCount,
                'record' => $bookCount,
                'unit' => 'buku selesai dibaca',
                'badges' => $this->makeBadges(
                    'reading',
                    [
                        ['threshold' => 1, 'name' => 'Pembaca Pemula'],
                        ['threshold' => 5, 'name' => 'Pecinta Buku'],
                        ['threshold' => 10, 'name' => 'Penjelajah Buku'],
                        ['threshold' => 100, 'name' => 'Kutu Buku'],
                    ],
                    $bookCount
                ),
            ],
        ];

        $allBadges = collect($categories)
            ->flatMap(fn ($category) => $category['badges']);

        return response()->json([
            'current_streak' => $currentStreak,
            'longest_streak' => $longestStreak,
            'ai_questions' => $aiCount,
            'study_activities' => $studyCount,
            'books_read' => $bookCount,
            'badge_count' => $allBadges->where('unlocked', true)->count(),
            'badge_total' => $allBadges->count(),
            'categories' => $categories,
        ]);
    }

    /**
     * Mencatat pertanyaan baru yang dikirim ke EduBot.
     */
    public function recordAiQuestion(Request $request)
    {
        $data = $request->validate([
            'request_id' => 'required|uuid',
        ]);

        $this->recordActivity(
            $request->user()->id,
            'ai_question',
            $data['request_id']
        );

        return response()->json([
            'message' => 'Aktivitas Tanya AI tercatat.',
        ]);
    }

    /**
     * Mencatat sesi belajar untuk suatu materi.
     * Materi yang sama dihitung maksimal sekali per hari.
     */
    public function recordStudySession(Request $request)
    {
        $data = $request->validate([
            'course_key' => [
                'required',
                Rule::in([self::COURSE_KEY]),
            ],
            'semester' => 'required|integer|in:1,2',
            'material_index' => 'required|integer|min:0|max:2',
        ]);

        $date = Carbon::now(self::TIMEZONE)->toDateString();

        $activityKey = sprintf(
            '%s:%s:s%d:m%d',
            $date,
            $data['course_key'],
            $data['semester'],
            $data['material_index']
        );

        $this->recordActivity(
            $request->user()->id,
            'study_session',
            $activityKey
        );

        return response()->json([
            'message' => 'Aktivitas belajar tercatat.',
        ]);
    }

    /**
     * Mencatat buku yang sudah selesai dibaca.
     * Buku yang sama hanya dihitung sekali per akun.
     */
    public function recordBookRead(Request $request)
    {
        $data = $request->validate([
            'book_key' => [
                'required',
                'string',
                Rule::in(array_keys(self::BOOKS)),
            ],
        ]);

        $this->recordActivity(
            $request->user()->id,
            'book_read',
            $data['book_key']
        );

        return response()->json([
            'message' => 'Buku berhasil dicatat sebagai selesai dibaca.',
        ]);
    }

    private function countActivities(
        int $userId,
        string $activityType
    ): int {
        return DB::table('learning_achievement_activities')
            ->where('user_id', $userId)
            ->where('activity_type', $activityType)
            ->count();
    }

    private function recordActivity(
        int $userId,
        string $activityType,
        string $activityKey
    ): void {
        $now = Carbon::now(self::TIMEZONE);

        DB::transaction(function () use (
            $userId,
            $activityType,
            $activityKey,
            $now
        ) {
            // Unique index mencegah aktivitas identik dihitung berulang.
            DB::table('learning_achievement_activities')
                ->insertOrIgnore([
                    'user_id' => $userId,
                    'activity_type' => $activityType,
                    'activity_key' => $activityKey,
                    'occurred_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

            DB::table('learning_activity_days')
                ->insertOrIgnore([
                    'user_id' => $userId,
                    'activity_date' => $now->toDateString(),
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
        });
    }

    private function makeBadges(
        string $prefix,
        array $definitions,
        int $value
    ): array {
        return array_map(function ($definition) use (
            $prefix,
            $value
        ) {
            $threshold = $definition['threshold'];

            return [
                'key' => $prefix . '-' . $threshold,
                'name' => $definition['name'],
                'threshold' => $threshold,
                'unlocked' => $value >= $threshold,
                'progress' => min(
                    100,
                    (int) floor(($value / $threshold) * 100)
                ),
            ];
        }, $definitions);
    }
}
