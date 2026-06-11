import { useState } from 'react';

// 账号头像：按 handle 现取（unavatar.io，免费、不依赖后端存头像、存量推文也能用），
// 取不到就回退成「首字母 + 按 handle 派生的固定配色圆」——永远不会裂图或空白。
// X 对头像抓取限制较严，回退态会比较常见，这正是它存在的意义。

function handleOf(account: string): string {
  return account.replace(/^@/, '').trim();
}

// 由 handle 派生一个稳定色相，让每个账号有自己固定的颜色，一眼可区分
function hueOf(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

export const AccountAvatar = ({ account, size = 36 }: { account: string; size?: number }) => {
  const [imgOk, setImgOk] = useState(true);
  const handle = handleOf(account);
  const letter = (handle.charAt(0) || '?').toUpperCase();
  const hue = hueOf(handle);

  return (
    <div
      className="relative shrink-0 rounded-full overflow-hidden flex items-center justify-center text-white font-bold select-none"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, hsl(${hue} 65% 55%), hsl(${(hue + 40) % 360} 65% 45%))`,
      }}
    >
      {/* 底层：首字母。图片加载成功会盖在上面；失败/被拦时露出它 */}
      <span style={{ fontSize: size * 0.42 }}>{letter}</span>
      {imgOk && (
        <img
          src={`https://unavatar.io/x/${handle}?fallback=false`}
          alt={account}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setImgOk(false)}
        />
      )}
    </div>
  );
};

export default AccountAvatar;
