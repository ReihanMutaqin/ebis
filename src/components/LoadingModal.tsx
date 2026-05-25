interface LoadingModalProps {
  isOpen: boolean;
}

export function LoadingModal({ isOpen }: LoadingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50">
      <div className="bg-white p-8 rounded-[20px] flex flex-col items-center justify-center text-center border-[3px] border-black" style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.4)' }}>
        <div className="w-16 h-16 border-[6px] border-[#ef4444] border-t-transparent rounded-full animate-spin mb-4" />
        <h5 className="font-bold mb-2 font-pixel text-sm tracking-wider">LOADING...</h5>
        <p className="text-gray-500 font-pixel text-xs">SABAR YA...</p>
      </div>
    </div>
  );
}
