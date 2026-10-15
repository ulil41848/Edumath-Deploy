<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentLearningProgress extends Model
{
    protected $table = 'student_learning_progress';

    protected $fillable = [
        'user_id',
        'title',
        'category',
        'is_completed',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'is_completed' => 'boolean',
            'completed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
