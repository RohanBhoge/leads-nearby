import React from 'react';
import { ArrowRight } from 'lucide-react';

const SERVICES = [
  {
    title: "Home Repair",
    subtitle: "Plumbing, Electrical, & More",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBT1E52HzFFZqH7xDuptw_REekRi1psKyLC5kPk7xOG51VwoZFOuVqXptI9AV7KRkb5SSOkBQTi5oddF88T7bhO8ZsaUfLzcFG3DMCdww2EWzgkbdisRuCCARlhyqKVf-PA40HbCdzcEptOG5wOw6hLoP-eJvuaVhflu-quwFfytiYljGPeqoRSfFgNs9TAGqMuNtx4sZSYbpdYARxFEUV9ny_1BzDc_1VxM-qyz3bD6OvFBjbWJFLbddykS4Fsk7N6WUjMBZwvWJQt"
  },
  {
    title: "IT Services",
    subtitle: "Repair, Setup, & Support",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCybdpm-hm6Mq0nPMmgamdHvukUCg2RdIBiRiAZAR4dQjBhgR3uBAut6tAn8W_8-nAYr_Iao-of0uj1shiDeo7JcIMBRfKgOuvXxzvIR0KnzCFmNeRC4Nldej9vfN_qESajYjJL0gH8n-WhEGfAFbFK9bo9hIc6k9FLHZZlGNlf-BjqFIJA3xgGvWS8vizuOQes20SsKpEPNhTQMs5AjhbXH5B8MC9UKgAhlf4d38yCBcBVvkyg4XaV8JQxuhLL7_XMHyaZtnEczHhM"
  },
  {
    title: "Events",
    subtitle: "Planning, Decor, & Catering",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB5DhIs7ZeU_MNQ7GsWz1BJCeH9qk6Nt3VC39RjTZM0PBUwvraJbPNDMG24yozkTyMv9wCwXmCtG6A5uDQ9rGNWheBAD-Zazbc3xUs1CV-5J3GJNlUhjoCTjTgSfR8ddX7u4D79rnlqkzgAXbhB7-6RjQli6SA7WcHSuqPsM7lV6Mn1-h6wlkpf2IOE5s4vH5NWHeLskL3o7eFUeO_KkbmAaKSYPcFUvzpgXDIYZ2K9FsNA_1Vrjlm8IeXOVkUuxoEtKAS3peUkNvgj"
  },
  {
    title: "Tuition",
    subtitle: "Math, Science, & Languages",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBh5vN8YAZSFtyazb_dtlXwidBtMTm4pyumSMrXLNltwLYCnPVJWnfBhRzriFcFqmJkywEDjWbA_vpTvODABihbAweLDY-0Wwnf_dDYWZm5jzpmgOI95w9644JZ2GTsyb5rFWw6kXpSfhLHBLHF-9zAbYZRfTq5tI0_lPukLURWpFtf1PpsQZWNnWFquHL1xYgglO1DI5jCJyqgOi8qfTqh4xDEsCdiH4yjTFgulOWqAPm0BsWxNarRb0CJOpe-R-sSmHM1AEM--7aq"
  },
  {
    title: "Beauty",
    subtitle: "Makeup, Hair, & Skincare",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDMstVlQOaAKRiw8gdw4dwkoav3pYWSYXjfLPwINMQUnNbObl7-_Bqux_NXAet3yc44e0-wWSVdqNwGJS-VHxxFRs8bUEdhgagYk3AZQhYGTKPZPqLJjSQNWt6Do3i2qRgTPZ5A0z4YteJF98VCOyQ8efiq7mgQ5YRhP6ZeYE_q_m3DYsU_3wUoSiYhx8nHIVroapxqvDar68XEdhigUKIqaobrhjRBJVVOwx3yGALf9haOUpvxlPRa8Fv4PcZ56M-z1dagT2-zp6i0"
  },
  {
    title: "Cleaning",
    subtitle: "Home, Office, & Deep Clean",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAzRIxRiV86T77u6C_exYSMk2NpBDL8sjQ9ktzxrnmFY1YyTnCrPrzNNeJIghod7jS05qK0orHhkbhR3U3TIFrcE9CTB1uUEnilVKG4673I5Xwic4P_xKCrSvlTKBfRu90gYw_mYAwpXVD_w9nguTE_u8I8ytsXd2WK14Waxe3zq8CREYUbYcmNEuAl9hKdc6X96RLJTdUNVs__OVLnFLEKHBBmngjBZ7fb5tOuv6YdU2EtUyga3BaNMDfGv1Hgg5mNC7YJ6WAG6u32"
  }
];

export const ServiceGrid: React.FC = () => {
  return (
    <div className="relative z-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">Popular Services</h3>
          <p className="text-slate-500 dark:text-slate-400">Browse categories to find exactly what you need.</p>
        </div>
        <a className="text-base font-semibold text-primary hover:text-primary-dark transition-colors flex items-center gap-1" href="#">
          See all categories
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {SERVICES.map((service) => (
          <div key={service.title} className="group relative overflow-hidden rounded-2xl h-48 md:h-64 cursor-pointer shadow-md hover:shadow-xl transition-all">
            <img 
              alt={service.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              src={service.image} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-70 transition-opacity"></div>
            <div className="absolute bottom-5 left-5 right-5">
              <span className="text-white font-bold text-xl md:text-2xl block mb-1 group-hover:translate-x-1 transition-transform">{service.title}</span>
              <span className="text-slate-200 text-sm hidden md:block opacity-0 group-hover:opacity-100 transition-opacity duration-300">{service.subtitle}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};