<?php

namespace App\Http\Controllers;

use App\Models\LoginHistory;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DayStreakController extends Controller
{
    public function history(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = Carbon::today();

        $dates = LoginHistory::where('user_id', $user->id)
            ->whereDate('login_date', '<=', $today)
            ->orderBy('login_date')
            ->pluck('login_date')
            ->map(fn ($date) => Carbon::parse($date)->toDateString())
            ->unique()
            ->values();

        $loginDates = $dates->flip();

        $currentStreak = 0;
        $checkDate = $today->copy();

        if (! $loginDates->has($checkDate->toDateString())) {
            $checkDate->subDay();
        }

        while ($loginDates->has($checkDate->toDateString())) {
            $currentStreak++;
            $checkDate->subDay();
        }

        $calendar = collect(range(27, 0))->map(function ($offset) use (
            $today,
            $loginDates
        ) {
            $date = $today->copy()->subDays($offset);

            return [
                'date' => $date->toDateString(),
                'day' => $date->translatedFormat('D'),
                'day_number' => $date->day,
                'logged_in' => $loginDates->has($date->toDateString()),
                'is_today' => $date->isSameDay($today),
            ];
        });

        return response()->json([
            'current_streak' => $currentStreak,
            'total_login_days' => $dates->count(),
            'login_dates' => $dates,
            'calendar' => $calendar,
        ]);
    }
}
