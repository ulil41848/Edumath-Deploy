<?php

namespace App\Providers;

use App\Listeners\RecordLoginHistory;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Event::listen(Login::class, RecordLoginHistory::class);
    }
}
