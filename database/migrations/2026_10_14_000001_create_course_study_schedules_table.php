<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('course_study_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('material_title', 160);
            $table->unsignedTinyInteger('semester')->default(1);
            $table->dateTime('starts_at');
            $table->unsignedSmallInteger('duration_minutes')->default(30);
            $table->string('reminder_email', 254);
            $table->unsignedSmallInteger('reminder_minutes')->default(15);
            $table->timestamp('reminder_sent_at')->nullable();
            $table->timestamps();
            $table->index(['starts_at', 'reminder_sent_at']);
        });
    }
    public function down(): void { Schema::dropIfExists('course_study_schedules'); }
};
