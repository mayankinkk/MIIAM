import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TableBooking = {
  id: string;
  vendorId: string;
  vendorName: string;
  date: string;
  time: string;
  guests: number;
  status: 'confirmed' | 'cancelled';
  createdAt: string;
};

type DiningStore = {
  bookings: TableBooking[];
  addBooking: (booking: Omit<TableBooking, 'id' | 'createdAt' | 'status'>) => void;
  cancelBooking: (id: string) => void;
};

export const useDiningStore = create<DiningStore>()(
  persist(
    (set) => ({
      bookings: [],
      addBooking: (booking) =>
        set((state) => ({
          bookings: [
            {
              ...booking,
              id: `book_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              createdAt: new Date().toISOString(),
              status: 'confirmed',
            },
            ...state.bookings,
          ],
        })),
      cancelBooking: (id) =>
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === id ? { ...b, status: 'cancelled' } : b
          ),
        })),
    }),
    {
      name: 'miiam-dining-storage',
    }
  )
);
