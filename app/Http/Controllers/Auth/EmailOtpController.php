<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Throwable;

class EmailOtpController extends Controller
{
    /**
     * Pendaftaran akun baru.
     */
    public function register(Request $request)
    {
        $request->merge([
            'email' => Str::lower(trim((string) $request->input('email'))),
        ]);

        $data = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:254|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $limitKey = 'otp-register:' . hash_hmac(
            'sha256',
            $data['email'],
            (string) config('app.key')
        );

        if (RateLimiter::tooManyAttempts($limitKey, 3)) {
            return response()->json([
                'message' => 'Terlalu banyak permintaan. Coba lagi nanti.',
            ], 429);
        }

        RateLimiter::hit($limitKey, 3600);

        $otp = str_pad(
            (string) random_int(0, 999999),
            6,
            '0',
            STR_PAD_LEFT
        );

        $otpHash = hash_hmac(
            'sha256',
            $otp,
            (string) config('app.key')
        );

        try {
            $user = DB::transaction(function () use ($data, $otpHash) {
                $user = User::create([
                    'name' => $data['name'],
                    'email' => $data['email'],
                    'password' => Hash::make($data['password']),
                ]);

                DB::table('email_otp_codes')->insert([
                    'user_id' => $user->id,
                    'code_hash' => $otpHash,
                    'expires_at' => now()->addMinutes(10),
                    'attempts' => 0,
                    'last_sent_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                return $user;
            });

            $this->sendOtpEmail($user->email, $otp);

            return response()->json([
                'message' => 'Akun dibuat. Periksa email Anda untuk kode OTP.',
                'email' => $user->email,
            ], 201);

        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Pendaftaran atau pengiriman email gagal. Periksa konfigurasi email.',
            ], 500);
        }
    }

    /**
     * Memverifikasi OTP.
     */
    public function verify(Request $request)
    {
        $request->merge([
            'email' => Str::lower(trim((string) $request->input('email'))),
        ]);

        $data = $request->validate([
            'email' => 'required|email|max:254',
            'otp' => ['required', 'regex:/^\d{6}$/'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || $user->email_verified_at) {
            return response()->json([
                'message' => 'Email atau OTP tidak valid.',
            ], 422);
        }

        $record = DB::table('email_otp_codes')
            ->where('user_id', $user->id)
            ->first();

        if (!$record) {
            return response()->json([
                'message' => 'OTP tidak ditemukan. Silakan minta kode baru.',
            ], 422);
        }

        if ($record->attempts >= 5) {
            return response()->json([
                'message' => 'Batas percobaan tercapai. Minta OTP baru.',
            ], 429);
        }

        if (Carbon::parse($record->expires_at)->isPast()) {
            DB::table('email_otp_codes')
                ->where('user_id', $user->id)
                ->delete();

            return response()->json([
                'message' => 'OTP kedaluwarsa. Silakan kirim ulang kode.',
            ], 422);
        }

        $submittedHash = hash_hmac(
            'sha256',
            $data['otp'],
            (string) config('app.key')
        );

        if (!hash_equals($record->code_hash, $submittedHash)) {
            DB::table('email_otp_codes')
                ->where('user_id', $user->id)
                ->increment('attempts');

            return response()->json([
                'message' => 'Kode OTP salah.',
            ], 422);
        }

        DB::transaction(function () use ($user) {
            DB::table('users')
                ->where('id', $user->id)
                ->update([
                    'email_verified_at' => now(),
                    'updated_at' => now(),
                ]);

            DB::table('email_otp_codes')
                ->where('user_id', $user->id)
                ->delete();
        });

        return response()->json([
            'message' => 'Email berhasil diverifikasi. Silakan login.',
        ]);
    }

    /**
     * Mengirimkan OTP baru.
     */
    public function resend(Request $request)
    {
        $request->merge([
            'email' => Str::lower(trim((string) $request->input('email'))),
        ]);

        $data = $request->validate([
            'email' => 'required|email|max:254',
        ]);

        $user = User::where('email', $data['email'])->first();

        // Respons umum agar tidak membocorkan status akun.
        if (!$user || $user->email_verified_at) {
            return response()->json([
                'message' => 'Jika akun membutuhkan verifikasi, ikuti petunjuk yang dikirim.',
            ]);
        }

        $limitKey = 'otp-resend:' . hash_hmac(
            'sha256',
            $user->email,
            (string) config('app.key')
        );

        if (RateLimiter::tooManyAttempts($limitKey, 3)) {
            return response()->json([
                'message' => 'Terlalu banyak permintaan. Coba lagi nanti.',
            ], 429);
        }

        $record = DB::table('email_otp_codes')
            ->where('user_id', $user->id)
            ->first();

        if (
            $record &&
            $record->last_sent_at &&
            Carbon::parse($record->last_sent_at)
                ->addSeconds(60)
                ->isFuture()
        ) {
            return response()->json([
                'message' => 'Tunggu 60 detik sebelum meminta OTP baru.',
            ], 429);
        }

        $otp = str_pad(
            (string) random_int(0, 999999),
            6,
            '0',
            STR_PAD_LEFT
        );

        $otpHash = hash_hmac(
            'sha256',
            $otp,
            (string) config('app.key')
        );

        DB::table('email_otp_codes')->updateOrInsert(
            ['user_id' => $user->id],
            [
                'code_hash' => $otpHash,
                'expires_at' => now()->addMinutes(10),
                'attempts' => 0,
                'last_sent_at' => now(),
                'created_at' => $record?->created_at ?? now(),
                'updated_at' => now(),
            ]
        );

        RateLimiter::hit($limitKey, 3600);

        try {
            $this->sendOtpEmail($user->email, $otp);

            return response()->json([
                'message' => 'Jika akun membutuhkan verifikasi, kode baru telah dikirim.',
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Email gagal dikirim. Periksa konfigurasi email.',
            ], 500);
        }
    }

    /**
     * Mengirim email berisi kode OTP.
     */
    
    /**
     * Memproses login menggunakan email dan password.
     */
    public function login(Request $request)
    {
        $request->merge([
            'email' => Str::lower(
                trim((string) $request->input('email'))
            ),
        ]);

        $data = $request->validate([
            'email' => 'required|email|max:254',
            'password' => 'required|string',
        ]);

        $key = 'login:' . hash(
            'sha256',
            $request->ip() . '|' . $data['email']
        );

        if (RateLimiter::tooManyAttempts($key, 5)) {
            return response()->json([
                'message' => 'Terlalu banyak percobaan. Coba lagi nanti.',
            ], 429);
        }

        $user = User::where('email', $data['email'])->first();

        if (
            !$user ||
            !Hash::check($data['password'], $user->password)
        ) {
            RateLimiter::hit($key, 60);

            return response()->json([
                'message' => 'Email atau kata sandi tidak sesuai.',
            ], 422);
        }

        if (!$user->email_verified_at) {
            return response()->json([
                'message' => 'Verifikasi email Anda sebelum login.',
            ], 403);
        }

        RateLimiter::clear($key);

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'message' => 'Login berhasil.',
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    /** Mengambil informasi akun yang sedang login. */
    public function account(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    /** Memperbarui nama profil pengguna. Email tidak diubah di sini. */
    public function updateProfile(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|min:2|max:100',
        ]);

        $user = $request->user();
        $user->name = trim($data['name']);
        $user->save();

        return response()->json([
            'message' => 'Nama profil berhasil diperbarui.',
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    /** Mengubah kata sandi dengan verifikasi kata sandi saat ini. */
    public function updatePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($data['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Kata sandi saat ini tidak sesuai.',
            ], 422);
        }

        $user->password = Hash::make($data['password']);
        $user->save();

        return response()->json([
            'message' => 'Kata sandi berhasil diubah.',
        ]);
    }

    /**
     * Mengakhiri sesi login.
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Anda berhasil logout.',
        ]);
    }

    private function sendOtpEmail(string $email, string $otp): void
    {
        Mail::raw(
            "Kode verifikasi EduMath Anda: {$otp}\n\n"
            . "Kode berlaku selama 10 menit.\n"
            . "Jangan bagikan kode ini kepada siapa pun.",
            function ($message) use ($email) {
                $message->to($email)
                    ->subject('Kode Verifikasi Akun EduMath');
            }
        );
    }
}
