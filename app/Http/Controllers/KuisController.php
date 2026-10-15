<?php

namespace App\Http\Controllers;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class KuisController extends Controller
{
    // Alamat backend AI (FastAPI). Harus sedang menyala.
    private const BACKEND_URL = 'http://127.0.0.1:8000/api/quiz';

    // Membuat soal baru. Kunci jawaban disimpan di server (session),
    // dan TIDAK dikirim ke browser.
    //   type    : choice (pilihan ganda) atau essay (essai)
    //   count   : jumlah soal (1 untuk chat, 10 untuk halaman kuis)
    //   context : chat atau kuis (dipisah supaya tidak saling menimpa)
    public function mulai(Request $request)
    {
        $data = $request->validate([
            'type' => 'required|in:choice,essay',
            'count' => 'required|integer|min:1|max:10',
            'context' => 'required|in:chat,kuis',
        ]);

        try {
            $response = Http::timeout(30)->get(self::BACKEND_URL, [
                'type' => $data['type'],
                'count' => $data['count'],
            ]);
        } catch (ConnectionException $e) {
            return response()->json([
                'message' => 'Soal belum bisa dibuat karena EduBot sedang tidak aktif.',
            ], 503);
        }

        $questions = $response->json('questions');

        if ($response->failed() || empty($questions)) {
            return response()->json([
                'message' => 'Soal gagal dibuat. Coba lagi ya.',
            ], 502);
        }

        $request->session()->put('soal_' . $data['context'], [
            'type' => $data['type'],
            'questions' => $questions,
        ]);

        return response()->json([
            'questions' => collect($questions)->map(function ($q) use ($data) {
                $item = [
                    'question' => $q['question'],
                    'difficulty' => $q['difficulty'],
                ];

                if ($data['type'] === 'choice') {
                    $item['choices'] = $q['choices'];
                }

                return $item;
            })->values(),
        ]);
    }

    // Memeriksa jawaban siswa untuk satu soal.
    public function jawab(Request $request)
    {
        $data = $request->validate([
            'context' => 'required|in:chat,kuis',
            'index' => 'required|integer|min:0',
            'choice' => 'required|string|max:40',
        ]);

        $saved = $request->session()->get('soal_' . $data['context']);

        if (!$saved || !isset($saved['questions'][$data['index']])) {
            return response()->json([
                'message' => 'Soal tidak ditemukan. Minta soal baru ya.',
            ], 422);
        }

        $question = $saved['questions'][$data['index']];
        $given = trim($data['choice']);

        // Jawaban essai: abaikan spasi dan titik pemisah ribuan (1.200 = 1200).
        if ($saved['type'] === 'essay') {
            $given = preg_replace('/[\s.]/', '', $given);
        }

        return response()->json([
            'correct' => $given === (string) $question['answer'],
            'answer' => (string) $question['answer'],
            'explanation' => $question['explanation'],
        ]);
    }
}
