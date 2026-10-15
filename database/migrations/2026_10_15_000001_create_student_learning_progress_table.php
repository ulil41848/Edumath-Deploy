<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_learning_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title', 120);
            $table->string('category', 60)->default('Matematika');
            $table->boolean('is_completed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'is_completed']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_learning_progress');
    }
};
