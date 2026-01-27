import { Appointment } from "@/core/domain/entities/Appointment";
import {
  AppointmentRepository,
  CreateAppointmentDTO,
} from "@/core/domain/repositories/AppointmentRepository";

const appointments: Appointment[] = [];

export class AppointmentRepositoryMock implements AppointmentRepository {
  async create(
    userId: string,
    data: CreateAppointmentDTO
  ): Promise<Appointment> {
    // 🚫 Bloquear horário duplicado no mesmo dia
    const conflict = appointments.find(
      (a) =>
        a.user_id === userId &&
        a.date === data.date &&
        a.time === data.time &&
        a.status !== "cancelled" &&
        a.status !== "rejected"
    );

    if (conflict) {
      throw new Error("Horário já ocupado");
    }

    const now = new Date().toISOString();

    const appointment: Appointment = {
      id: crypto.randomUUID(),
      user_id: userId,
      patient_id: data.patient_id,
      date: data.date,
      time: data.time,
      status: "pending", // 🔥 começa pendente
      notes: data.notes ?? null,
      created_at: now,
      updated_at: now,
    };

    appointments.push(appointment);
    return appointment;
  }

  async listByUser(userId: string): Promise<Appointment[]> {
    return appointments.filter((a) => a.user_id === userId);
  }

  async listByDate(userId: string, date: string): Promise<Appointment[]> {
    return appointments.filter(
      (a) => a.user_id === userId && a.date === date
    );
  }

  async approve(id: string): Promise<void> {
    const appt = appointments.find((a) => a.id === id);
    if (appt) {
      appt.status = "approved";
      appt.updated_at = new Date().toISOString();
    }
  }

  async reject(id: string): Promise<void> {
    const appt = appointments.find((a) => a.id === id);
    if (appt) {
      appt.status = "rejected";
      appt.updated_at = new Date().toISOString();
    }
  }

  async cancel(id: string): Promise<void> {
    const appt = appointments.find((a) => a.id === id);
    if (appt) {
      appt.status = "cancelled";
      appt.updated_at = new Date().toISOString();
    }
  }
}
