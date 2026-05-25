export function DuckAnimation() {
  return (
    <div className="relative w-full h-[35px] mb-[5px] overflow-hidden">
      <div
        className="absolute bottom-0 w-[35px] h-[35px]"
        style={{
          backgroundImage: 'url(/bebek.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          left: 0,
          transform: 'scaleX(1)',
          animation: 'walkRightLeft 12s linear infinite',
        }}
      />
      <div
        className="absolute bottom-0 w-[35px] h-[35px]"
        style={{
          backgroundImage: 'url(/bebek.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          right: 0,
          transform: 'scaleX(-1)',
          animation: 'walkLeftRight 12s linear infinite',
        }}
      />
    </div>
  );
}
