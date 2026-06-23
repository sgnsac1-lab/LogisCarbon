import { ReactNode, FormEvent } from "react"
import { X } from "lucide-react"


interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  funcion: (e: FormEvent<HTMLFormElement>) => void;
}

export default function Modal({ isOpen, onClose, title, children, footer, funcion }: ModalProps) {
    if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={funcion}>
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            {children}
          </div>
        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
            {footer}
          </div>
        )}
        </form>
      </div>
    </div>
  )
}
