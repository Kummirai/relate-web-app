export default function Footer() {
  return (
    <footer className="py-10 md:py-14 px-4 sm:px-6 md:px-8 lg:px-20" style={{ background: "#1d2a4d" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="text-center md:text-left">
            <a href="/" className="text-xl font-bold" style={{ color: "#13c5dd" }}>
              Relate
            </a>
            <p className="text-xs text-white/60 mt-1">Skills · Social · Spiritual</p>
          </div>

          {/* Links */}
          <div className="flex gap-6 text-xs text-white/60">
            <a href="/signin" className="hover:text-white transition">
              Sign In
            </a>
            <a href="/signup" className="hover:text-white transition">
              Sign Up
            </a>
            <a href="https://www.facebook.com/RelateApp" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
              Facebook
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <p className="text-xs text-white/40">&copy; {new Date().getFullYear()} Relate. All rights reserved.</p>
          <div className="flex gap-4">
            {/* Facebook */}
            <a href="https://www.facebook.com/RelateApp" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
