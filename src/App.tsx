import React, { useState, useEffect, useRef, useCallback } from 'react';
import './index.css';
import { translations } from './translations';

/* ═══════════════════════════════════════════
   PARTICLES SYSTEM
   ═══════════════════════════════════════════ */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

const ParticleCanvas: React.FC<{ theme: string }> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animationId = useRef<number>(0);
  const mouse = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize particles
    const count = Math.min(80, Math.floor(window.innerWidth / 20));
    particles.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.4 + 0.1,
    }));

    const handleMouse = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouse);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const color = theme === 'dark' ? '96, 165, 250' : '0, 102, 255';

      particles.current.forEach((p, i) => {
        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off edges
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${p.opacity})`;
        ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < particles.current.length; j++) {
          const p2 = particles.current[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${color}, ${0.06 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        // Mouse interaction — gentle push
        const mdx = p.x - mouse.current.x;
        const mdy = p.y - mouse.current.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 120) {
          const force = (120 - mdist) / 120;
          p.vx += (mdx / mdist) * force * 0.15;
          p.vy += (mdy / mdist) * force * 0.15;
        }

        // Dampen velocity
        p.vx *= 0.998;
        p.vy *= 0.998;
      });

      animationId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
    };
  }, [theme]);

  return <canvas ref={canvasRef} className="particles-canvas" />;
};

/* ═══════════════════════════════════════════
   SCROLL ANIMATION HOOK
   ═══════════════════════════════════════════ */
const useScrollAnimation = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);
};

/* ═══════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════ */
const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('portfolio-theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  const [lang, setLang] = useState<'en' | 'de'>('en');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[lang];

  useEffect(() => {
    localStorage.setItem('portfolio-theme', theme);
    document.documentElement.className = theme;
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useScrollAnimation();

  // Re-trigger scroll animations when content changes (language switch)
  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelectorAll('.animate-on-scroll').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
          el.classList.add('visible');
        }
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [lang]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'en' ? 'de' : 'en'));
  }, []);

  return (
    <div className={`app ${theme}`}>
      {/* Animated Background */}
      <ParticleCanvas theme={theme} />
      <div className="mesh-gradient">
        <div className="blob" />
        <div className="blob" />
        <div className="blob" />
        <div className="blob" />
      </div>

      {/* ═══ NAVIGATION ═══ */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} id="main-nav">
        <div className="nav-inner">
          <div className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            MY<span style={{ opacity: 0.4 }}>.</span>
          </div>

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            id="mobile-menu-toggle"
          >
            <span />
            <span />
            <span />
          </button>

          <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <a href="#about" onClick={() => setMobileMenuOpen(false)}>{t.nav.about}</a>
            <a href="#skills" onClick={() => setMobileMenuOpen(false)}>{t.nav.skills}</a>
            <a href="#experience" onClick={() => setMobileMenuOpen(false)}>{t.nav.experience}</a>
            <a href="#projects" onClick={() => setMobileMenuOpen(false)}>{t.nav.projects}</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)}>{t.nav.contact}</a>
            <div className="controls">
              <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme" id="theme-toggle">
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              <button className="icon-btn" onClick={toggleLang} aria-label="Toggle language" id="lang-toggle">
                {lang === 'en' ? 'DE' : 'EN'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="hero" id="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="pulse-dot" />
            {t.hero.available || 'Open to Opportunities'}
          </div>

          <h1 className="hero-title">
            <span className="gradient-text">{t.hero.title}</span>
          </h1>

          <p className="hero-subtitle">{t.hero.subtitle}</p>

          <div className="hero-certs">
            <div className="cert-badge">
              <span className="cert-icon">🏅</span>
              {t.hero.badges.aws}
            </div>
            <div className="cert-badge">
              <span className="cert-icon">☁️</span>
              {t.hero.badges.azure}
            </div>
            <div className="cert-badge">
              <span className="cert-icon">🌐</span>
              {t.hero.badges.ccna}
            </div>
          </div>

          <div className="hero-cta-group">
            <a href="#projects" className="btn-primary" id="hero-cta-projects">
              {t.hero.cta}
              <span>→</span>
            </a>
            <a href="#contact" className="btn-outline" id="hero-cta-contact">
              {t.nav.contact}
            </a>
            <a
              href={`${import.meta.env.BASE_URL}Mubarek_Yeshaw_Tahir_CV.pdf`}
              download
              className="btn-outline"
              id="hero-cta-cv"
            >
              {t.hero.resumeCta || 'Download CV'}
            </a>
          </div>
        </div>

        <div className="scroll-indicator">
          <span>Scroll</span>
          <div className="scroll-line" />
        </div>
      </section>

      {/* ═══ ABOUT ═══ */}
      <section id="about">
        <div className="section-wrapper">
          <div className="section-inner">
            <div className="section-header center animate-on-scroll">
              <div className="section-label">
                <span className="label-line" />
                {t.about.title}
                <span className="label-line" />
              </div>
              <h2 className="section-title">{t.about.heading || t.about.title}</h2>
            </div>

            <div className="about-bento">
              <div className="bento-card bento-main animate-on-scroll delay-1">
                <div className="bento-icon">👨‍💻</div>
                <h3>{t.about.title}</h3>
                <p>{t.about.text}</p>

                <div className="role-tags">
                  {t.about.roleTags.map((role) => (
                    <span className="role-tag" key={role}>{role}</span>
                  ))}
                </div>

                <div className="about-stats">
                  <div className="stat-item">
                    <div className="stat-number">2+</div>
                    <div className="stat-label">{t.about.stats?.years || 'Years Exp.'}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">2</div>
                    <div className="stat-label">{t.about.stats?.certs || 'Certifications'}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">2</div>
                    <div className="stat-label">{t.about.stats?.projects || 'Projects'}</div>
                  </div>
                </div>
              </div>

              <div className="bento-card animate-on-scroll delay-2">
                <div className="bento-icon">🎓</div>
                <h3>{t.about.education || 'Education'}</h3>
                {t.about.educationList.map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>

              <div className="bento-card animate-on-scroll delay-3">
                <div className="bento-icon">📍</div>
                <h3>{t.about.location || 'Location'}</h3>
                <p>{t.about.locationText || "Based in Passau, Germany — open to remote & on-site roles across the EU."}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SKILLS ═══ */}
      <section id="skills">
        <div className="section-wrapper">
          <div className="section-inner">
            <div className="section-header center animate-on-scroll">
              <div className="section-label">
                <span className="label-line" />
                {t.skills.title}
                <span className="label-line" />
              </div>
              <h2 className="section-title">{t.skills.title}</h2>
              <p className="section-desc">
                {t.skills.desc || 'A comprehensive toolkit spanning networking, cloud, and software engineering.'}
              </p>
            </div>

            <div className="tech-cloud animate-on-scroll delay-1">
              {t.skills.techList.map((tech) => (
                <span className="skill-tag" key={tech}>{tech}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ EXPERIENCE ═══ */}
      <section id="experience">
        <div className="section-wrapper">
          <div className="section-inner">
            <div className="section-header animate-on-scroll">
              <div className="section-label">
                <span className="label-line" />
                {t.experience.title}
              </div>
              <h2 className="section-title">{t.experience.title}</h2>
            </div>

            {t.experience.entries.map((entry, i) => (
              <div className={`experience-card animate-on-scroll delay-${Math.min(i + 1, 3)}`} key={entry.role}>
                <div className="exp-header">
                  <div>
                    <div className="exp-role">{entry.role}</div>
                    <div className="exp-company">
                      <span>🏢</span>
                      {entry.company}
                    </div>
                  </div>
                  <div className="exp-date">
                    <span>📅</span>
                    {entry.date}
                  </div>
                </div>

                <ul className="exp-list">
                  {entry.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PROJECTS ═══ */}
      <section id="projects">
        <div className="section-wrapper">
          <div className="section-inner">
            <div className="section-header center animate-on-scroll">
              <div className="section-label">
                <span className="label-line" />
                {t.projects.title}
                <span className="label-line" />
              </div>
              <h2 className="section-title">{t.projects.title}</h2>
              <p className="section-desc">
                {t.projects.desc || 'Hands-on projects showcasing cloud architecture and AI capabilities.'}
              </p>
            </div>

            <div className="projects-grid">
              <div className="project-card animate-on-scroll delay-1">
                <div className="project-number">01</div>
                <h3>{t.projects.azure.title}</h3>
                <p>{t.projects.azure.desc}</p>
                <div className="project-tags">
                  <span className="project-tag">Azure</span>
                  <span className="project-tag">VNets</span>
                  <span className="project-tag">NSGs</span>
                  <span className="project-tag">Zero Trust</span>
                </div>
              </div>

              <div className="project-card animate-on-scroll delay-2">
                <div className="project-number">02</div>
                <h3>{t.projects.vdas.title}</h3>
                <p>{t.projects.vdas.desc}</p>
                <div className="project-tags">
                  <span className="project-tag">AI / CNN</span>
                  <span className="project-tag">OpenCV</span>
                  <span className="project-tag">Python</span>
                  <span className="project-tag">Real-time</span>
                </div>
              </div>
            </div>

            <p className="projects-more animate-on-scroll">
              {t.projects.moreText}{' '}
              <a href="https://github.com/itsmubarek" target="_blank" rel="noreferrer">
                {t.projects.moreLink} →
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ═══ CONTACT / FOOTER ═══ */}
      <footer id="contact" className="contact-section">
        <div className="section-wrapper">
          <div className="section-inner">
            <div className="contact-inner animate-on-scroll">
              <div className="section-label" style={{ justifyContent: 'center' }}>
                <span className="label-line" />
                {t.contact.title}
                <span className="label-line" />
              </div>

              <h2 className="contact-title">
                <span className="gradient-text">{t.contact.title}</span>
              </h2>

              <div className="contact-info">
                <p className="contact-location">📍 {t.contact.location}</p>
                <a href="mailto:itsmubade@gmail.com" className="contact-email">
                  itsmubade@gmail.com
                </a>
              </div>

              <div className="social-links">
                <a
                  href="https://linkedin.com/in/mubarek-yeshaw"
                  target="_blank"
                  rel="noreferrer"
                  className="social-link"
                  id="social-linkedin"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </a>
                <a
                  href="https://github.com/itsmubarek"
                  target="_blank"
                  rel="noreferrer"
                  className="social-link"
                  id="social-github"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                  </svg>
                  GitHub
                </a>
              </div>

              <p className="footer-copy">
                © {new Date().getFullYear()} Mubarek Yeshaw • {t.contact.copy}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
