<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\DB;

class RecordLoginHistory
{
    public function handle(Login $event): void
    {
        $now = now();

        DB::table('login_histories')->insertOrIgnore([
            'user_id' => $event->user->id,
            'login_date' => $now->toDateString(),
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }
}
