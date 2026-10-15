<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoginHistory extends Model
{
    protected $fillable = [
        'user_id',
        'login_date',
    ];

    protected function casts(): array
    {
        return [
            'login_date' => 'date',
        ];
    }
}
