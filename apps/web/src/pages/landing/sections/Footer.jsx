import { Github, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-surface-border py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center">
                <span className="text-white font-bold text-xs">B</span>
              </div>
              <span className="font-semibold text-text-primary">BizOS</span>
            </div>
            <p className="text-xs text-text-tertiary leading-relaxed">
              AI operating system for Indian SMBs. Run your business in plain language.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Product</p>
            <ul className="space-y-2">
              {['Features', 'Pricing', 'Changelog', 'Roadmap'].map(item => (
                <li key={item}>
                  <a href="#" className="text-xs text-text-tertiary hover:text-text-secondary transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Company</p>
            <ul className="space-y-2">
              {['About', 'Blog', 'Careers', 'Contact'].map(item => (
                <li key={item}>
                  <a href="#" className="text-xs text-text-tertiary hover:text-text-secondary transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Legal</p>
            <ul className="space-y-2">
              {['Privacy policy', 'Terms of service', 'Refund policy', 'Security'].map(item => (
                <li key={item}>
                  <a href="#" className="text-xs text-text-tertiary hover:text-text-secondary transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-surface-border gap-4">
          <p className="text-xs text-text-tertiary">
            © 2026 BizOS. All rights reserved. Made in India 🇮🇳
          </p>
          <div className="flex items-center gap-4">
            {[Twitter, Github, Linkedin].map((Icon, i) => (
              <a key={i} href="#" className="text-text-tertiary hover:text-text-secondary transition-colors">
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
