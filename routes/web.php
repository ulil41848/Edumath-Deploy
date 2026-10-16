<?php

use App\Http\Controllers\AchievementController;
use App\Http\Controllers\Auth\EmailOtpController;
use App\Http\Controllers\CourseStudyScheduleController;
use App\Http\Controllers\DashboardStatsController;
use App\Http\Controllers\DayStreakController;
use App\Http\Controllers\GuruModeSessionController;
use App\Http\Controllers\KuisController;
use App\Http\Controllers\LearningProgressController;
use App\Http\Controllers\TanyaAiController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::view('/aplikasi', 'welcome')->name('app.home');

Route::post('/register', [EmailOtpController::class, 'register'])
    ->name('register');

Route::post('/verify-otp', [EmailOtpController::class, 'verify'])
    ->name('otp.verify');

Route::post('/resend-otp', [EmailOtpController::class, 'resend'])
    ->name('otp.resend');

Route::post('/login', [EmailOtpController::class, 'login'])
    ->name('auth.login');

Route::middleware('auth')->group(function () {
    Route::get('/account', [EmailOtpController::class, 'account'])->name('account.show');
    Route::patch('/account/profile', [EmailOtpController::class, 'updateProfile'])->name('account.profile.update');
    Route::patch('/account/password', [EmailOtpController::class, 'updatePassword'])->name('account.password.update');
    Route::post('/logout', [EmailOtpController::class, 'logout'])->name('auth.logout');
    Route::get('/study-schedules', [CourseStudyScheduleController::class, 'index'])->name('study-schedules.index');
    Route::post('/study-schedules', [CourseStudyScheduleController::class, 'store'])->name('study-schedules.store');
    Route::delete('/study-schedules/{schedule}', [CourseStudyScheduleController::class, 'destroy'])->name('study-schedules.destroy');
});
Route::middleware('auth')->prefix('learning-progress')->group(function () {
    Route::get('/', [
        LearningProgressController::class,
        'index',
    ])->name('learning-progress.index');

    Route::post('/', [
        LearningProgressController::class,
        'update',
    ])->name('learning-progress.update');
});
Route::middleware('auth')->get(
    '/day-streak/history',
    [DayStreakController::class, 'history']
)->name('day-streak.history');
Route::middleware('auth')->group(function () {
    Route::get('/dashboard/stats', [
        DashboardStatsController::class,
        'show',
    ])->name('dashboard.stats');

    Route::post('/dashboard/visit-course', [
        DashboardStatsController::class,
        'visitCourse',
    ])->name('dashboard.visit-course');
});

Route::middleware('auth')->prefix('achievements')->group(function () {
    Route::get('/', [
        AchievementController::class,
        'index',
    ])->name('achievements.index');

    Route::post('/ai-question', [
        AchievementController::class,
        'recordAiQuestion',
    ])->name('achievements.ai-question');

    Route::post('/study-session', [
        AchievementController::class,
        'recordStudySession',
    ])->name('achievements.study-session');

    Route::post('/book-read', [
        AchievementController::class,
        'recordBookRead',
    ])->name('achievements.book-read');
});

Route::middleware(['auth', 'throttle:10,1'])
    ->prefix('guru-sessions')
    ->name('guru-sessions.')
    ->group(function () {
        Route::get('/', [GuruModeSessionController::class, 'index'])->name('index');
        Route::post('/', [GuruModeSessionController::class, 'store'])->name('store');
        Route::get('/{session}', [GuruModeSessionController::class, 'show'])->name('show');
        Route::post('/{session}/turns', [GuruModeSessionController::class, 'turn'])->name('turns.store');
        Route::post('/{session}/hints', [GuruModeSessionController::class, 'hint'])->name('hints.store');
        Route::post('/{session}/complete', [GuruModeSessionController::class, 'complete'])->name('complete');
    });

Route::get('/tanya-ai', [TanyaAiController::class, 'index']);
Route::post('/tanya-ai', [TanyaAiController::class, 'ask']);
Route::post('/tanya-ai/chat', [TanyaAiController::class, 'chat']);
Route::post('/kuis/mulai', [KuisController::class, 'mulai']);
Route::post('/kuis/jawab', [KuisController::class, 'jawab']);
