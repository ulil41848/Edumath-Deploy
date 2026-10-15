<?php

namespace App\Http\Controllers;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class TanyaAiController extends Controller
{
    // Alamat backend AI (FastAPI). Harus sedang menyala.
    private const BACKEND_URL = 'http://127.0.0.1:8000/api/ask';

    // Halaman Tanya AI versi sederhana (berdiri sendiri).
    public function index()
    {
        return view('tanya-ai');
    }

    public function ask(Request $request)
    {
        $data = $request->validate([
            'question' => 'required|string|max:300',
        ]);

        set_time_limit(130);

        $result = null;
        $error = null;

        try {
            $response = Http::timeout(120)->post(self::BACKEND_URL, [
                'question' => $data['question'],
            ]);

            if ($response->failed()) {
                $error = 'Backend AI mengembalikan error.';
            } else {
                $result = $response->json();
            }
        } catch (ConnectionException $e) {
            $error = 'Backend AI belum menyala. Jalankan uvicorn di folder backend.';
        }

        return view('tanya-ai', [
            'question' => $data['question'],
            'result' => $result,
            'error' => $error,
        ]);
    }

    // Dipakai oleh chat di halaman utama EduMath (balasan berupa JSON).
    public function chat(Request $request)
    {
        $data = $request->validate([
            'question' => 'required|string|max:300',
        ]);

        set_time_limit(130);

        try {
            $response = Http::timeout(120)->post(self::BACKEND_URL, [
                'question' => $data['question'],
            ]);
        } catch (ConnectionException $e) {
            return response()->json([
                'message' => 'Maaf, EduBot sedang tidak aktif. Coba lagi nanti ya.',
            ], 503);
        }

        if ($response->failed()) {
            return response()->json([
                'message' => 'Maaf, terjadi kesalahan di EduBot. Coba lagi ya.',
            ], 502);
        }

        $result = $response->json();

        // Penjelasan Llama hanya ditampilkan kalau berhasil (Ollama menyala).
        $explanation = $result['llama'] ?? null;
        if ($explanation && str_starts_with($explanation, 'Gagal menghubungi Ollama')) {
            $explanation = null;
        }

        return response()->json([
            'answer' => $result['checker'] ?? null,
            'explanation' => $explanation,
        ]);
    }
}
