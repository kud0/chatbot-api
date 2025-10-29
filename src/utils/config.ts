import barbershopConfig from '../config/barbershop.json';

export interface BusinessInfo {
  name: string;
  description: string;
  phone: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  email: string;
  timezone: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: {
    amount: number;
    currency: string;
  };
  originalPrice?: {
    amount: number;
    currency: string;
  };
  discount?: boolean;
  category: string;
}

export interface BusinessHours {
  [key: string]: {
    open?: string;
    close?: string;
    closed?: boolean;
    breaks?: Array<{
      start: string;
      end: string;
    }>;
  };
}

export function getBusinessInfo(): BusinessInfo {
  return {
    name: barbershopConfig.business.name,
    description: barbershopConfig.business.description.es,
    phone: barbershopConfig.business.contact.phone,
    address: barbershopConfig.business.contact.address,
    email: barbershopConfig.business.contact.email,
    timezone: barbershopConfig.business.timezone,
  };
}

export function getServices(): Service[] {
  return barbershopConfig.services.map(service => ({
    id: service.id,
    name: service.name.es,
    description: service.description.es,
    duration: service.duration,
    price: service.price,
    originalPrice: service.originalPrice,
    discount: service.discount,
    category: service.category,
  }));
}

export function getBusinessHours(): BusinessHours {
  return barbershopConfig.businessHours;
}

export function getWhatsAppLink(message: string = 'Hola! Me gustaría información sobre servicios'): string {
  const phone = barbershopConfig.business.contact.phone.replace('+', '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encodedMessage}`;
}

export function formatPrice(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
}
