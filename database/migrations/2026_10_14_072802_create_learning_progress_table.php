
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('learning_progress', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('course_key', 100)
                ->default('matematika-kelas-3');

            $table->unsignedTinyInteger('semester');
            $table->unsignedTinyInteger('material_index');
            $table->timestamp('completed_at');

            $table->timestamps();

            $table->unique([
                'user_id',
                'course_key',
                'semester',
                'material_index',
            ], 'learning_progress_unique_item');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('learning_progress');
    }
};
