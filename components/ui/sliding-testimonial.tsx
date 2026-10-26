const testimonials = [
  {
    name: 'Alena Zhukova',
    profession: 'Software Engineer',
    description:
      'Swapped USDC into WETH in one transaction. The quote was live and the settlement was instant.',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80',
  },
  {
    name: 'Aiko',
    profession: 'Design Engineer',
    description:
      'Connect, quote, swap. That is the whole flow. No clutter and no surprise fees.',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80',
  },
  {
    name: 'Lisa Kemp',
    profession: 'Frontend Developer',
    description:
      'Uniswap v4 liquidity on Arc, priced straight from the pool. It just works.',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80',
  },
  {
    name: 'Paula Smith',
    profession: 'UX Designer',
    description:
      'I trade on the terminal and check the wallet score when I need it. Both in one place.',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80',
  },
];

const duplicatedTestimonials = [...testimonials, ...testimonials];

const SlidingTestimonial = () => {
  return (
    <section className="border-t border-white/10 bg-neutral-950">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Swaps on Arc, in one screen
        </h2>
        <p className="mt-3 text-neutral-400">
          Live Uniswap v4 liquidity, with wallet reputation when you need it.
        </p>

        <div
          style={{
            maskImage:
              'linear-gradient(to left, transparent 0%, black 20%, black 80%, transparent 95%)',
          }}
          className="relative mt-12 flex w-full max-w-full overflow-hidden"
        >
          <div className="animate-x-slider flex w-max gap-5">
            {duplicatedTestimonials.map((testimonial, indx) => (
              <div
                key={indx}
                className="flex w-[600px] shrink-0 grow-0 flex-col rounded-2xl border border-white/10 bg-neutral-900/50 max-sm:w-[420px]"
              >
                <p className="px-6 py-6 text-pretty text-xl font-light tracking-tighter text-neutral-200 sm:text-2xl">
                  &quot;{testimonial.description}&quot;
                </p>
                <div className="flex w-full items-center gap-3 border-t border-white/10 px-4 py-3">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                  />
                  <div className="flex flex-col">
                    <h5 className="text-sm font-medium text-white md:text-base">{testimonial.name}</h5>
                    <p className="-mt-0.5 text-sm text-neutral-500 md:text-base">{testimonial.profession}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SlidingTestimonial;
