import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { SPIN_PRIZES, canUserSpin, recordSpin, auth } from '../services/firebase';
import { SpinPrize } from '../types';
import { Gift, Loader2 } from 'lucide-react';

const LuckySpin: React.FC = () => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<SpinPrize | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [remainingDays, setRemainingDays] = useState(0);
  
  const currentUser = auth.currentUser || JSON.parse(localStorage.getItem('bte04_demo_user') || 'null');

  useEffect(() => {
    if (currentUser) {
      checkPermission();
    }
  }, [currentUser]);

  const checkPermission = async () => {
    const status = await canUserSpin(currentUser.uid);
    setAllowed(status.allowed);
    if (status.remainingDays) setRemainingDays(status.remainingDays);
  };

  const spin = () => {
    if (!allowed || spinning) return;
    
    setSpinning(true);
    setResult(null);

    // Calculate result based on probability
    const rand = Math.random() * 100;
    let accumulated = 0;
    let selectedPrize = SPIN_PRIZES[0];
    
    for (const prize of SPIN_PRIZES) {
      accumulated += prize.probability;
      if (rand <= accumulated) {
        selectedPrize = prize;
        break;
      }
    }

    // Calculate rotation to land on the selected prize
    // Assume 5 segments, 72deg each
    const segmentAngle = 360 / SPIN_PRIZES.length;
    const prizeIndex = SPIN_PRIZES.indexOf(selectedPrize);
    const targetRotation = 360 * 5 + (360 - (prizeIndex * segmentAngle)); // Spin 5 times + alignment

    setRotation(targetRotation);

    setTimeout(async () => {
      setSpinning(false);
      setResult(selectedPrize);
      setAllowed(false);
      setRemainingDays(7);
      await recordSpin(currentUser.uid, selectedPrize.id);
    }, 5000); // 5s animation
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto text-center py-10">
        <h1 className="text-3xl font-extrabold text-primary-900 mb-4 flex justify-center items-center gap-2">
          <Gift className="text-earth-500" /> Vòng Quay May Mắn
        </h1>
        <p className="text-gray-600 mb-8">Cơ hội nhận quà mỗi tuần dành riêng cho thành viên BTE04!</p>

        {!allowed && remainingDays > 0 && !result && (
          <div className="bg-orange-100 text-orange-800 p-4 rounded-xl mb-8">
            Bạn đã quay tuần này. Vui lòng quay lại sau <b>{remainingDays} ngày</b>.
          </div>
        )}

        <div className="relative w-80 h-80 mx-auto mb-10">
          {/* Pointer */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-8 h-10 bg-red-600" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}></div>
          
          {/* Wheel */}
          <div 
            className="w-full h-full rounded-full border-8 border-yellow-400 overflow-hidden shadow-2xl relative transition-transform duration-[5000ms] cubic-bezier(0.25, 0.1, 0.25, 1)"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {SPIN_PRIZES.map((prize, index) => {
               const angle = 360 / SPIN_PRIZES.length;
               return (
                 <div 
                   key={prize.id}
                   className="absolute w-1/2 h-full top-0 right-0 origin-left flex items-center justify-center"
                   style={{ 
                     transform: `rotate(${index * angle}deg)`,
                     backgroundColor: prize.color,
                     clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' // Simplification for demo
                   }}
                 >
                   {/* Text rendering inside conical segments is tricky in pure CSS without skew, using a simple colored block for demo visual */}
                 </div>
               );
            })}
             {/* Simple center label overlay since CSS conic slices are hard */}
            <div className="absolute inset-0 rounded-full flex items-center justify-center">
                 <span className="font-bold text-white text-xl drop-shadow-md">BTE04</span>
            </div>
          </div>
        </div>
        
        {/* Result */}
        {result && (
            <div className="mb-8 animate-bounce">
                <h3 className="text-2xl font-bold text-green-600">Chúc mừng! Bạn nhận được:</h3>
                <p className="text-xl text-gray-800">{result.label}</p>
            </div>
        )}

        {/* Action Button */}
        <button
          onClick={spin}
          disabled={!allowed || spinning}
          className={`px-12 py-4 rounded-full text-xl font-bold shadow-xl transition-all ${
            allowed && !spinning
             ? 'bg-gradient-to-r from-red-500 to-yellow-500 text-white hover:scale-105'
             : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {spinning ? 'Đang quay...' : 'QUAY NGAY'}
        </button>
        
        <div className="mt-12 text-left">
            <h3 className="font-bold text-gray-800 mb-2">Giải thưởng bao gồm:</h3>
            <ul className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                {SPIN_PRIZES.map(p => (
                    <li key={p.id} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{backgroundColor: p.color}}></span>
                        {p.label}
                    </li>
                ))}
            </ul>
        </div>
      </div>
    </Layout>
  );
};

export default LuckySpin;