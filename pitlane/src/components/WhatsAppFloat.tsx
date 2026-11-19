import {useState} from 'react';
import {MessageCircle, X} from 'lucide-react';
import {useApp} from '../context/AppContext';

export function WhatsAppFloat() {
  const {route, buildWhatsAppUrl, bootstrap} = useApp();
  const [open, setOpen] = useState(false);

  // Avoid overlapping mobile sticky checkout controls
  const isCheckout = route.startsWith('/checkout');

  const quickPrompts = [
    {
      label: 'Sizing & Fit Advice',
      message: 'Hello PITLANE! I need help choosing the right garment size before ordering.',
    },
    {
      label: 'Order & Delivery Status',
      message: 'Hello PITLANE! Could you help me check the status of my order?',
    },
    {
      label: 'International Shipping Quote',
      message: 'Hello PITLANE! I would like details about international DHL Express shipping.',
    },
  ];

  return (
    <div
      className={`fixed right-4 z-30 ${
        isCheckout ? 'bottom-24 md:bottom-6' : 'bottom-5 md:bottom-6'
      }`}
    >
      {open && (
        <div
          role="dialog"
          aria-label="PITLANE WhatsApp Concierge"
          className="mb-3 w-72 sm:w-80 bg-[#181A1D] border border-[#27272A] shadow-2xl"
        >
          <div className="px-4 py-3 bg-[#111315] border-b border-[#27272A] flex items-center justify-between">
            <div>
              <p className="font-display text-lg uppercase tracking-wide text-white">
                PITLANE Concierge
              </p>
              <p className="font-mono-tabular text-[11px] text-[#71717A]">
                WhatsApp · {bootstrap?.whatsappBusinessPhone || '+923001234567'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close WhatsApp concierge"
              className="min-w-[40px] min-h-[40px] flex items-center justify-center text-[#C6C6C7] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-2">
            <p className="text-xs text-[#C6C6C7] mb-3">
              Start a direct WhatsApp conversation with our Lahore studio team:
            </p>
            {quickPrompts.map((qp) => (
              <a
                key={qp.label}
                href={buildWhatsAppUrl(qp.message)}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-left px-3 py-2.5 bg-[#111315] border border-[#27272A] hover:border-[#EF2929] text-xs font-medium text-white transition-colors"
              >
                {qp.label} →
              </a>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Chat with PITLANE on WhatsApp"
        aria-expanded={open}
        className="h-12 px-4 bg-[#111315] border border-[#27272A] hover:border-[#EF2929] text-white flex items-center gap-2.5 shadow-xl transition-colors"
      >
        <span className="w-8 h-8 bg-[#25D366] text-[#090A0B] flex items-center justify-center">
          <MessageCircle className="w-4 h-4 fill-current" />
        </span>
        <span className="hidden sm:inline font-mono-tabular text-xs font-semibold uppercase tracking-wider">
          WhatsApp
        </span>
      </button>
    </div>
  );
}
