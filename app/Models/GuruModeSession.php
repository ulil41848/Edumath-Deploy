<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GuruModeSession extends Model
{
    protected $fillable = [
        'user_id', 'grade', 'material_key', 'material_title', 'status',
        'turns', 'current_question', 'current_hint', 'hint_count',
        'evaluation', 'understanding_level', 'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'grade' => 'integer',
            'turns' => 'array',
            'hint_count' => 'integer',
            'evaluation' => 'array',
            'completed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
