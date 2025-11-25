import React from 'react';

const ANSWEAR_AD = {
  id: 'answear',
  link: 'https://hxbok.com/g/81ij5uqbfl4c128fa66ba76d99edd2/?i=4',
  image: 'https://ad.admitad.com/b/81ij5uqbfl4c128fa66ba76d99edd2/',
  alt: 'Answear UA'
};

const AdBanner: React.FC = () => {
  return (
    <div className="w-full max-w-md mt-4 flex flex-col items-center">
        {/* Label above the banner */}
        <div className="w-full flex justify-start items-center mb-1.5 px-1 opacity-50">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <span>Реклама</span>
                <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                <span className="text-zinc-400">Answear</span>
            </span>
        </div>

        <a
          href={ANSWEAR_AD.link}
          target="_blank"
          rel="nofollow noopener noreferrer"
          className="block w-full h-[90px] overflow-hidden rounded-xl shadow-lg border border-white/10 hover:border-white/20 transition-all duration-300 active:scale-[0.98] relative group"
        >
          <img
            src={ANSWEAR_AD.image}
            alt={ANSWEAR_AD.alt}
            className="w-full h-full object-cover block bg-[#1a1a1a]"
            width="600"
            height="90"
            loading="eager"
            // @ts-ignore
            fetchpriority="high"
          />
          {/* Subtle hover sheen */}
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors pointer-events-none"></div>
        </a>
    </div>
  );
};

export default AdBanner;

