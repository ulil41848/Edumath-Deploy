<?php
use App\Http\Controllers\TanyaAiController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\EmailOtpController;
use App\Http\Controllers\CourseStudyScheduleController;
use App\Http\Controllers\DayStreakController;
use App\Http\Controllers\KuisController;

Route::get('/', function () {
    return view('welcome');
});

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
        \App\Http\Controllers\LearningProgressController::class,
        'index',
    ])->name('learning-progress.index');

    Route::post('/', [
        \App\Http\Controllers\LearningProgressController::class,
        'update',
    ])->name('learning-progress.update');
});
Route::middleware('auth')->get(
    '/day-streak/history',
    [DayStreakController::class, 'history']
)->name('day-streak.history');
Route::middleware('auth')->group(function () {
    Route::get('/dashboard/stats', [
        \App\Http\Controllers\DashboardStatsController::class,
        'show',
    ])->name('dashboard.stats');

    Route::post('/dashboard/visit-course', [
        \App\Http\Controllers\DashboardStatsController::class,
        'visitCourse',
    ])->name('dashboard.visit-course');
});

Route::middleware('auth')->prefix('achievements')->group(function () {
    Route::get('/', [
        \App\Http\Controllers\AchievementController::class,
        'index',
    ])->name('achievements.index');

    Route::post('/ai-question', [
        \App\Http\Controllers\AchievementController::class,
        'recordAiQuestion',
    ])->name('achievements.ai-question');

    Route::post('/study-session', [
        \App\Http\Controllers\AchievementController::class,
        'recordStudySession',
    ])->name('achievements.study-session');

    Route::post('/book-read', [
        \App\Http\Controllers\AchievementController::class,
        'recordBookRead',
    ])->name('achievements.book-read');
});
   Route::get('/tanya-ai', [TanyaAiController::class, 'index']);
   Route::post('/tanya-ai', [TanyaAiController::class, 'ask']);
   Route::post('/tanya-ai/chat', [TanyaAiController::class, 'chat']);
   Route::post('/kuis/mulai', [KuisController::class, 'mulai']);
   Route::post('/kuis/jawab', [KuisController::class, 'jawab']);