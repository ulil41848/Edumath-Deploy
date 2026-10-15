
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('learning_activity_days', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->date('activity_date');
            $table->timestamps();

            $table->unique(
                ['user_id', 'activity_date'],
                'learning_activity_user_day_unique'
            );
        });

        Schema::create('learning_course_visits', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('course_key', 100);
            $table->unsignedTinyInteger('semester');
            $table->timestamp('last_opened_at');

            $table->timestamps();

            $table->unique(
                ['user_id', 'course_key', 'semester'],
                'learning_course_visit_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('learning_course_visits');
        Schema::dropIfExists('learning_activity_days');
    }
};
