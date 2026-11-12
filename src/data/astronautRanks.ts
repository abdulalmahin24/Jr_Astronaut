/**
 * astronautRanks.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Official NASA-inspired Cadet Rank Hierarchy & Progression System for Jr_AstroCamp.
 * Divides astronaut qualifications from beginner children (Junior Stargazer)
 * up to the highest supreme interplanetary post (Supreme Interplanetary Commander).
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface AstronautRank {
  level: number;
  id: string;
  titleEn: string;
  titleBn: string;
  badgeEmoji: string;
  badgeName: string;
  color: string;
  bgGradient: string;
  glowColor: string;
  minXp: number;
  ageGroup: string;
  nasaEquivalent: string;
  summary: string;
  responsibilities: string[];
  unlockedGear: string[];
  promotionCriteria: string;
}

export const ASTRONAUT_RANKS: AstronautRank[] = [
  {
    level: 1,
    id: 'rank-1-stargazer',
    titleEn: 'Junior Stargazer & Space Scout',
    titleBn: 'জুনিয়র স্টারগেজার ও স্পেস স্কাউট (লেভেল ১)',
    badgeEmoji: '🔭',
    badgeName: 'Bronze Stargazer Crest',
    color: '#38bdf8',
    bgGradient: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(2, 132, 199, 0.25))',
    glowColor: 'rgba(56, 189, 248, 0.5)',
    minXp: 0,
    ageGroup: '৬ – ৯ বছর (শিশুদের প্রাথমিক মহাকাশ যাত্রা)',
    nasaEquivalent: 'NASA Junior Space Scout / Earth Observer',
    summary: 'মহাকাশ অভিযানের প্রথম হাতেখড়ি। রাতের আকাশের নক্ষত্রমণ্ডল, চাঁদ ও সৌরজগতের গ্রহগুলোর সাথে পরিচয় এবং প্রাথমিক সায়েন্স জ্ঞান অর্জন।',
    responsibilities: [
      'রাতের আকাশের প্রধান নক্ষত্রমণ্ডল (কালপুরুষ, সপ্তর্ষিমণ্ডল ইত্যাদি) চেনা',
      'চাঁদের প্রধান গহ্বর ও শান্তিসমুদ্রের (Sea of Tranquility) অবস্থান শনাক্ত করা',
      'STEM Graphic Novels (সায়েন্স কমিক বই ১-২) পড়ে প্রাথমিক ধারণা নেওয়া',
      'গ্রাউন্ড স্কুলের বেসিক অডিও-ভিডিও লেকচারে অংশ নেওয়া'
    ],
    unlockedGear: [
      '🔭 অপটিক্যাল স্টারগেজার টেলিস্কোপ',
      '🗺️ লুনার সারফেস ও কন্সটেলেশন স্কাই ম্যাপ',
      '📓 ক্যাডেট মিশন ফিল্ড নোটবুক'
    ],
    promotionCriteria: 'সায়েন্স কমিক ১-২ পড়া ও যেকোনো ১টি কুইজে অংশ নিয়ে ২৫০ এক্সপি অর্জন।'
  },
  {
    level: 2,
    id: 'rank-2-ascan',
    titleEn: 'ASCAN — Astronaut Candidate',
    titleBn: 'এসক্যান — শিক্ষানবিস মহাকাশচারী (লেভেল ২)',
    badgeEmoji: '🪖',
    badgeName: 'Silver Candidate Wings',
    color: '#a78bfa',
    bgGradient: 'linear-gradient(135deg, rgba(167, 139, 250, 0.25), rgba(124, 58, 237, 0.25))',
    glowColor: 'rgba(167, 139, 250, 0.5)',
    minXp: 250,
    ageGroup: '৯ – ১২ বছর (মিডল স্কুল ক্যাডেট)',
    nasaEquivalent: 'Houston Astronaut Candidate (Johnson Space Center)',
    summary: 'নাসার অফিশিয়াল ফ্লাইট ট্রেইনিং প্রার্থী। হিউস্টন পুলে স্কুবা ডাইভিং, সেন্ট্রিফিউজে রকেটের জি-ফোর্স সহ্য করা এবং গ্রাউন্ড একাডেমি পরীক্ষার প্রস্তুতি।',
    responsibilities: [
      'Houston NBL স্পেসওয়াক পুলে ডাইভিং (পানির নিচে ৭ ঘণ্টা কাজ = মহাকাশে ১ ঘণ্টা স্পেসওয়াক)',
      'সেন্ট্রিফিউজ রিগে 4G থেকে 9G পর্যন্ত তীব্র মহাকর্ষীয় টান ও চাপ সহ্য করার অনুশীলন',
      'মরুভূমি, গুহা ও তুষার অঞ্চলে সারভাইভাল ট্রেনিং সম্পন্ন করা',
      'Earth Ground Academy কোয়ালিফাইং এক্সামে পাস করে অফিশিয়াল ফ্লাইট পিন অর্জন'
    ],
    unlockedGear: [
      '❄️ LCVG লিকুইড কুলিং অ্যান্ড ভেন্টিলেশন আন্ডারগার্মেন্ট',
      '🎧 স্নুপি ক্যাপ ডুয়াল কমিউনিকেশন হেডসেট (CCA)',
      '✈️ T-38 সুপারসনিক জেট ফ্লাইট সিমুলেটর কোড'
    ],
    promotionCriteria: 'Earth Ground Academy এক্সামে পাস করা ও ৬০০ এক্সপি অর্জন।'
  },
  {
    level: 3,
    id: 'rank-3-specialist',
    titleEn: 'Flight Engineer & Mission Specialist',
    titleBn: 'ফ্লাইট ইঞ্জিনিয়ার ও মিশন স্পেশালিস্ট (লেভেল ৩)',
    badgeEmoji: '🛠️',
    badgeName: 'Gold Spacewalk Specialist Wings',
    color: '#10b981',
    bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.25))',
    glowColor: 'rgba(16, 185, 129, 0.5)',
    minXp: 600,
    ageGroup: '১২ – ১৫ বছর (হাইস্কুল ক্যাডেট)',
    nasaEquivalent: 'Active ISS / Lunar Gateway Mission Specialist',
    summary: 'মহাকাশে ভাসমান স্পেস স্টেশনের বাইরে স্পেসওয়াক (EVA) এবং লাইফ সাপোর্ট ইঞ্জিনিয়ারিং পরিচালনাকারী সার্টিফাইড মহাকাশচারী।',
    responsibilities: [
      'মহাকাশের শূন্যতায় (ভ্যাকুয়াম) সরাসরি স্পেসওয়াক (EVA) পরিচালনা',
      'রোবোটিক কানাডার্ম আর্ম দিয়ে কার্গো ক্যাপসুল সফলভাবে ক্যাপচার করা',
      'Sabatier কেমিক্যাল রিঅ্যাক্টরে কার্বন ডাই অক্সাইড ও হাইড্রোজেন থেকে পানি ও মিথেন উৎপাদন',
      'প্রেসারাইজড স্যুট ও এয়ারলকের প্রেশার ড্রপ ইমার্জেন্সি মেরামত'
    ],
    unlockedGear: [
      '🎒 PLSS পোর্টেবল লাইফ সাপোর্ট ব্যাকপ্যাক (৮.৫ ঘণ্টা অক্সিজেন)',
      '🛡️ 14-লেয়ার TMG মাইক্রোমেটিওরয়েড শিল্ড ও গোল্ড ভাইজর',
      '🧤 ফেজ-VI ইলেকট্রিক হিটেড গ্লাভস ও SAFER ইমার্জেন্সি জেটপ্যাক'
    ],
    promotionCriteria: '৫টি ফ্লাইট মডিউল সম্পন্ন করা ও ১,২০০ এক্সপি অর্জন।'
  },
  {
    level: 4,
    id: 'rank-4-navigator',
    titleEn: 'Lunar Surface Navigator & Rover Pilot',
    titleBn: 'লুনার সারফেস নেভিগেটর ও রোভার পাইলট (লেভেল ৪)',
    badgeEmoji: '🚜',
    badgeName: 'Lunar Rover Golden Wheel Crest',
    color: '#f97316',
    bgGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.25), rgba(194, 65, 12, 0.25))',
    glowColor: 'rgba(249, 115, 22, 0.5)',
    minXp: 1200,
    ageGroup: 'সিনিয়র স্পেস একাডেমি ক্যাডেট',
    nasaEquivalent: 'Artemis Lunar Surface Rover Pilot',
    summary: 'চাঁদের দক্ষিণ মেরুর শেকলটন খাদের ধার ঘেঁষে রোভার চালানো এবং মাইনাস ২৫০ ডিগ্রি ঠান্ডায় চির-অন্ধকার খাঁদ থেকে বরফ ও খনিজ উত্তোলক এক্সপার্ট।',
    responsibilities: [
      'শেকলটন ক্র্যাটারের চির-অন্ধকার খাদে (PSR) রোভার সাবধানে ড্রাইভ করা',
      'রোটারি পারকাসিভ ড্রিল দিয়ে ৩ মিটার মাটির গভীর থেকে প্রিমিটিভ আইস-কোর স্যাম্পল উত্তোলন',
      'টাইটানিয়াম মেশ হুইল ও লুনার টেরামেকানিক্স কন্ট্রোল করা',
      'SHERLOC আল্ট্রাভায়োলেট লেজার দিয়ে খনিজ ও বরফের আণবিক বিশ্লেষণ সম্পন্ন করা'
    ],
    unlockedGear: [
      '🚜 Artemis MK-IV লুনার সারফেস রোভারের ফুল পাইলট লাইসেন্স',
      '🔬 Rotary Percussive Deep Ice Core Drill ও SHERLOC স্পেকট্রোমিটার',
      '🧪 Indium Knife-Edge Hermetic স্যাম্পল রিটার্ন ফ্লাস্ক'
    ],
    promotionCriteria: 'রোভার এক্সপ্লোরেশন মিশনে ড্রিলিং করা ও ২,৫০০ এক্সপি অর্জন।'
  },
  {
    level: 5,
    id: 'rank-5-commander',
    titleEn: 'Lunar Outpost Commander',
    titleBn: 'লুনার আউটপোস্ট কমান্ডার (লেভেল ৫)',
    badgeEmoji: '👑',
    badgeName: 'Artemis Base Commander Wreath',
    color: '#f59e0b',
    bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.25))',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    minXp: 2500,
    ageGroup: 'এলিট মিশন লিডার',
    nasaEquivalent: 'Commander, Artemis Base Camp (South Pole Station)',
    summary: 'চাঁদের প্রথম স্থায়ী মানব বসতির প্রধান। ১২টি ক্যাম্পাসের অবকাঠামো পরিচালনা, বিদ্যুৎ উৎপাদন এবং ৩৫৪ ঘণ্টার প্রতিকূল লুনার নাইটে ক্রুদের বাঁচিয়ে রাখার সর্বোচ্চ অভিভাবক।',
    responsibilities: [
      'চাঁদের টানা ৩৫৪ ঘণ্টার হিমাঙ্কিত রাত ও সোলার স্টর্মে ক্রুদের শূন্য ক্যাজুয়ালটিতে বাঁচিয়ে রাখা',
      'কিলোপাওয়ার ১০ কিলোওয়াট নিউক্লিয়ার ফিশন রিঅ্যাক্টর ও এনার্জি গ্রিড স্বয়ংক্রিয় ব্যালান্সিং',
      '১২টি অ্যাকাডেমি ও ডিপো ফ্যাসিলিটির সমন্বিত কার্যক্রম পর্যবেক্ষণ',
      'রেগোলিথ ৩ডি প্রিন্টিং ও মেগাওয়াট পাওয়ার রেডিয়েশন বাঙ্কার নিয়ন্ত্রণ'
    ],
    unlockedGear: [
      '🏛️ ফুল ১২-স্টেশন আর্টেমিস অ্যাকাডেমি মাস্টার ব্লুপ্রিন্ট',
      '⚛️ Kilopower 10 kWe নিউক্লিয়ার ফিশন প্রাইমারি পাওয়ার কি',
      '📡 Ka-Band ডিপ স্পেস হাই-গেইন আর্থ কমিউনিকেশনস মাস্ট'
    ],
    promotionCriteria: 'চাঁদে ৩০ সল (Sol 30) বেঁচে থাকা ও ৪,০০০ এক্সপি অর্জন।'
  },
  {
    level: 6,
    id: 'rank-6-supreme',
    titleEn: 'Supreme Interplanetary Commander',
    titleBn: 'ডিপ স্পেস পায়োনিয়ার ও সুপ্রিম কমান্ডার (সর্বোচ্চ পদবী - লেভেল ৬)',
    badgeEmoji: '🌌',
    badgeName: 'Diamond Nebula Grand Cross',
    color: '#e11d48',
    bgGradient: 'linear-gradient(135deg, rgba(225, 29, 72, 0.25), rgba(159, 18, 57, 0.25))',
    glowColor: 'rgba(225, 29, 72, 0.6)',
    minXp: 4000,
    ageGroup: 'মাস্টার অফ স্পেস এক্সপ্লোরেশন (Supreme Rank)',
    nasaEquivalent: 'Chief of the NASA Astronaut Office / Mars Mission Director',
    summary: 'সমগ্র মহাকাশ অভিযানের অভিভাবক ও সর্বোচ্চ সম্মানিত পদবী। মঙ্গল গ্রহের জেজেরো খাদে আর্টেমিস থেকে এরেস বেস নির্মাণ এবং পরবর্তী প্রজন্মের নতুন মহাকাশচারীদের পথপ্রদর্শক।',
    responsibilities: [
      'মঙ্গলে জেজেরো খাদের এরেস আউটপোস্টে ল্যান্ডিং ও হিউম্যান কলোনাইজেশন পরিচালনা',
      'নাসার ৭৬টি ঐতিহাসিক ও ভবিষ্যত মহাকাশ অভিযানের মাস্টার চিফ হিসেবে কমান্ড দেওয়া',
      'পরবর্তী প্রজন্মের তরুণ শিশু-কিশোর ও ক্যাডেটদের মেন্টর ও মহাকাশ লিডার হিসেবে গড়ে তোলা',
      'ডিপ স্পেস ইন্টারপ্ল্যানেটারি ট্র্যাজেক্টরি ও ইন্টারস্টেলার প্রজেক্ট নির্ধারণ'
    ],
    unlockedGear: [
      '🚀 Orion Deep Space Interplanetary Starship',
      '💎 Diamond Nebula Grand Cross & Supreme Space Medal',
      '🏆 NASA International Space Apps Hall of Fame Permanent Legend Status'
    ],
    promotionCriteria: 'সর্বোচ্চ পদবী অর্জিত! আপনি এখন পরবর্তী প্রজন্মের পথপ্রদর্শক।'
  }
];

export function getRankByLevel(level: number): AstronautRank {
  return ASTRONAUT_RANKS.find((r) => r.level === level) || ASTRONAUT_RANKS[0];
}

export function getCurrentRank(xp: number): AstronautRank {
  for (let i = ASTRONAUT_RANKS.length - 1; i >= 0; i--) {
    if (xp >= ASTRONAUT_RANKS[i].minXp) {
      return ASTRONAUT_RANKS[i];
    }
  }
  return ASTRONAUT_RANKS[0];
}

export function getNextRank(xp: number): AstronautRank | null {
  const current = getCurrentRank(xp);
  const nextLevel = current.level + 1;
  return ASTRONAUT_RANKS.find((r) => r.level === nextLevel) || null;
}

export function getRankProgress(xp: number): {
  currentRank: AstronautRank;
  nextRank: AstronautRank | null;
  progressPercent: number;
  xpNeeded: number;
} {
  const currentRank = getCurrentRank(xp);
  const nextRank = getNextRank(xp);

  if (!nextRank) {
    return {
      currentRank,
      nextRank: null,
      progressPercent: 100,
      xpNeeded: 0
    };
  }

  const range = nextRank.minXp - currentRank.minXp;
  const earnedInRange = Math.max(0, xp - currentRank.minXp);
  const progressPercent = Math.min(100, Math.floor((earnedInRange / range) * 100));
  const xpNeeded = Math.max(0, nextRank.minXp - xp);

  return {
    currentRank,
    nextRank,
    progressPercent,
    xpNeeded
  };
}
