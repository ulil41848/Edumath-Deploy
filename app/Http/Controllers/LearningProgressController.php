<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LearningProgressController extends Controller
{
    private const COURSE_KEY = 'matematika-kelas-3';
    private const TOTAL_MATERIALS = 3;

    /**
     * Mengambil progres belajar siswa untuk semester tertentu.
     */
    public function index(Request $request)
    {
        $data = $request->validate([
            'semester' => 'required|integer|in:1,2',
        ]);

        return response()->json(
            $this->getSummary(
                $request->user()->id,
                (int) $data['semester']
            )
        );
    }

    /**
     * Menandai materi selesai atau belum selesai.
     */
    public function update(Request $request)
    {
        $data = $request->validate([
            'semester' => 'required|integer|in:1,2',
            'material_index' => 'required|integer|min:0|max:2',
            'completed' => 'required|boolean',
        ]);

        $userId = $request->user()->id;
        $semester = (int) $data['semester'];
        $materialIndex = (int) $data['material_index'];

        $keys = [
            'user_id' => $userId,
            'course_key' => self::COURSE_KEY,
            'semester' => $semester,
            'material_index' => $materialIndex,
        ];

        if ($request->boolean('completed')) {
            DB::table('learning_progress')->updateOrInsert(
                $keys,
                [
                    'completed_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            $message = 'Materi berhasil ditandai selesai.';
        } else {
            DB::table('learning_progress')
                ->where($keys)
                ->delete();

            $message = 'Status materi dikembalikan menjadi belum selesai.';
        }

        return response()->json([
            'message' => $message,
            'progress' => $this->getSummary($userId, $semester),
        ]);
    }

    /**
     * Menghitung progres berdasarkan materi yang selesai.
     */
    private function getSummary(int $userId, int $semester): array
    {
        $completedIndices = DB::table('learning_progress')
            ->where('user_id', $userId)
            ->where('course_key', self::COURSE_KEY)
            ->where('semester', $semester)
            ->orderBy('material_index')
            ->pluck('material_index')
            ->map(fn ($index) => (int) $index)
            ->all();

        $completedCount = count($completedIndices);

        return [
            'course_key' => self::COURSE_KEY,
            'semester' => $semester,
            'completed_indices' => $completedIndices,
            'completed_count' => $completedCount,
            'total_count' => self::TOTAL_MATERIALS,
            'percent' => (int) round(
                ($completedCount / self::TOTAL_MATERIALS) * 100
            ),
        ];
    }
}
