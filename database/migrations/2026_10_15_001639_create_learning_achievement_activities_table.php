
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('learning_achievement_activities', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('activity_type', 30);
            $table->string('activity_key', 120);
            $table->timestamp('occurred_at');

            $table->timestamps();

            $table->unique(
                ['user_id', 'activity_type', 'activity_key'],
                'learning_achievement_activity_unique'
            );

            $table->index(['user_id', 'activity_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('learning_achievement_activities');
    }
};
