declare global {
  interface ScreenOrientation {
    lock(orientation: string): Promise<void>;
    unlock(): void;
  }
}

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// --- DATA & TYPES --- //


interface Project {
  id: string;
  title: string;
  type: string;
  imageUrl: string;
  duration: string; // e.g., "3 Weeks"
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  outcome: string;
  stack: string[];
  tags: string[];
  date: string; // YYYY-MM-DD for sorting
  description: string;
  role: string;
  process: string[];
  challenges: string;
  gallery: string[];
  links?: {
    github?: string;
    liveDemo?: string;
    youtube?: string;
  };
}

interface SocialLinks {
    youtube: string;
    linkedin: string;
    github: string;
    blog: string;
    email: string;
}

// --- UTILITY HOOKS & FUNCTIONS --- //

const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, value]);

  return [value, setValue];
};

const useAnimatedVisibility = <T extends HTMLElement>(options = { threshold: 0.1, triggerOnce: true }) => {
    const ref = useRef<T>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                if (options.triggerOnce && ref.current) {
                    observer.unobserve(ref.current);
                }
            }
        }, options);

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, [ref, options]);

    return [ref, isVisible] as const;
};


// --- UI COMPONENTS --- //

const Header: React.FC<{
    activePage: string;
    setActivePage: (page: string) => void;
    isProjectOpen: boolean;
    projectTypes: string[];
}> = ({ activePage, setActivePage, isProjectOpen, projectTypes }) => {
    return (
        <header className={`header ${isProjectOpen ? 'hidden' : ''}`}>
            <div className="container">
                <div className="logo" onClick={() => setActivePage('Frontend')}>
                    <span>SUNGYONG LEE</span>
                </div>
                <nav>
                    <ul>
                        {projectTypes.map(type => (<li key={type} className={activePage === type ? 'active' : ''} onClick={() => setActivePage(type)}>{type}</li>))}
                        <li className={activePage === 'About' ? 'active' : ''} onClick={() => setActivePage('About')}>About Me</li>
                    </ul>
                </nav>
                 <div className="admin-link" onClick={() => setActivePage('AdminLogin')} title="Admin Panel">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L2 5v6c0 5.55 3.84 10.74 9 12 .34-.08.66-.2.98-.36-.88-1.02-1.48-2.26-1.48-3.64 0-2.76 2.24-5 5-5 .34 0 .68.03 1 .09V5l-8-3.6zM20.19 14.83c-1.35-1.01-3.28-1.1-4.2-.28-.9.8-1.01 2.72-.28 4.2.73 1.48 2.65 2.14 4.2 1.25s2.14-2.65 1.25-4.2c-.39-.68-.94-1.23-1.62-1.62l.35.35L19.5 13l-1.41-1.41-1.06 1.06.35.35c.34-.17.65-.41.92-.7z"></path></svg>
                </div>
            </div>
        </header>
    );
};

const ProjectCard: React.FC<{ project: Project; onClick: () => void }> = ({ project, onClick }) => {
    const [ref, isVisible] = useAnimatedVisibility<HTMLDivElement>();
    return (
        <div ref={ref} className={`project-card ${isVisible ? 'visible' : ''}`} onClick={onClick}>
            <div className="card-image" style={{ backgroundImage: `url(${project.imageUrl})` }}></div>
            <div className="card-content">
                <span className="card-type">{project.type}</span>
                <h3>{project.title}</h3>
                <p className="card-outcome">{project.outcome}</p>
                <div className="card-details">
                    <span><strong>Duration:</strong> {project.duration}</span>
                    <span><strong>Difficulty:</strong> {project.difficulty}</span>
                </div>
                <div className="card-stack">
                    <strong>Tech Stack:</strong>
                    <div>{project.stack?.join(', ')}</div>
                </div>
                <div className="card-tags">
                    {project.tags?.map(tag => <span key={tag} className="tag">{tag}</span>)}
                </div>
            </div>
        </div>
    );
};

const ProjectList: React.FC<{ projects: Project[]; onProjectSelect: (id: string) => void }> = ({ projects, onProjectSelect }) => {
    if (projects.length === 0) {
        return <p className="no-projects">No projects found for the current filters.</p>;
    }
    return (
        <div className="project-grid">
            {projects.map(p => <ProjectCard key={p.id} project={p} onClick={() => onProjectSelect(p.id)} />)}
        </div>
    );
};

const ConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    children: React.ReactNode;
}> = ({ isOpen, onClose, onConfirm, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button onClick={onClose} className="icon-button close-button" aria-label="Close modal">&times;</button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
                <div className="modal-footer">
                    <button onClick={onClose}>Cancel</button>
                    <button onClick={onConfirm} className="button-danger">Confirm</button>
                </div>
            </div>
        </div>
    );
};

const Lightbox: React.FC<{
    images: string[];
    currentIndex: number;
    onClose: () => void;
    onNavigate: (direction: 'prev' | 'next') => void;
}> = ({ images, currentIndex, onClose, onNavigate }) => {
    const prevIndexRef = useRef(currentIndex);
    const touchStartRef = useRef<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartRef.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartRef.current === null) return;

        const touchEnd = e.changedTouches[0].clientX;
        const touchDiff = touchStartRef.current - touchEnd;
        const swipeThreshold = 50; // 최소 스와이프 거리

        if (touchDiff > swipeThreshold) {
            // 왼쪽으로 스와이프 -> 다음 이미지
            onNavigate('next');
        } else if (touchDiff < -swipeThreshold) {
            // 오른쪽으로 스와이프 -> 이전 이미지
            onNavigate('prev');
        }

        touchStartRef.current = null; // 초기화
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') onNavigate('prev');
            if (e.key === 'ArrowRight') onNavigate('next');
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, onNavigate]);

    let animationClass = 'fade-in-scale';
    const prev = prevIndexRef.current;
    const current = currentIndex;
    const len = images.length;

    if (prev !== current) {
        if ((prev + 1) % len === current) {
            animationClass = 'slide-in-next';
        } else {
            animationClass = 'slide-in-prev';
        }
    }

    useEffect(() => {
        prevIndexRef.current = currentIndex;
    });

    if (currentIndex === null || !images || images.length === 0) return null;

    return (
        <div className="lightbox-overlay" onClick={onClose}>
            <div className="lightbox-wrapper" onClick={(e) => e.stopPropagation()} onTouchStart={handleTouchStart}
    onTouchEnd={handleTouchEnd}>
                <button className="lightbox-close" aria-label="Close image viewer" onClick={onClose}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
                </button>
                <button className="lightbox-nav prev" onClick={() => onNavigate('prev')} aria-label="Previous image">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z"/></svg>
                </button>
                
                {/* <div className="lightbox-cinematic-container"> */}
                    {/* <div className="cinematic-bar top"></div> */}
                    <div className="lightbox-image-container">
                        {/* <div
                            className="lightbox-background-image"
                            style={{ backgroundImage: `url(${images[currentIndex]})` }}
                         ></div> */}
                        <div key={currentIndex} className={`lightbox-image-wrapper ${animationClass}`}>
                            <img
                                src={images[currentIndex]}
                                alt={`Gallery image ${currentIndex + 1}`}
                                className="lightbox-image"
                                onLoad={(e) => e.currentTarget.style.opacity = '1'}
                            />
                        </div>
                    </div>
                    {/* <div className="cinematic-bar bottom"> */}
                        
                    {/* </div>  
                </div> */}

                <button className="lightbox-nav next" onClick={() => onNavigate('next')} aria-label="Next image">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
                </button>
                <div className="lightbox-caption">
                    {currentIndex + 1} / {images.length}
                </div>
            </div>
        </div>
    );
};

// --- PAGES / VIEWS --- //

const PortfolioPage: React.FC<{ projects: Project[], type: string, onProjectSelect: (id: string) => void }> = ({ projects, type, onProjectSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [sortOrder, setSortOrder] = useState<'date-desc' | 'date-asc' | 'title-asc' | 'title-desc'>('date-desc');
    const [showSort, setShowSort] = useState(false);

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        projects.filter(p => p.type === type).forEach(p => p.tags?.forEach(t => tags.add(t)));
        return Array.from(tags).sort();
    }, [projects, type]);

    const filteredProjects = useMemo(() => {
        return projects
            .filter(p => p.type === type)
            .filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())))
            .filter(p => selectedTags.length === 0 || selectedTags.every(st => p.tags?.includes(st)))
            .sort((a, b) => {
                switch (sortOrder) {
                    case 'date-asc': return new Date(a.date).getTime() - new Date(b.date).getTime();
                    case 'title-asc': return a.title.localeCompare(b.title);
                    case 'title-desc': return b.title.localeCompare(a.title);
                    case 'date-desc':
                    default:
                        return new Date(b.date).getTime() - new Date(a.date).getTime();
                }
            });
    }, [projects, type, searchTerm, selectedTags, sortOrder]);

    const toggleTag = (tag: string) => {
        setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };
    
    return (
        <main className="container page-content">
            <div className="filters">
                <input
                    type="search"
                    placeholder={`Search in ${type} projects...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-bar"
                    aria-label="Search projects"
                />
                <div className="sort-container">
                    <button onClick={() => setShowSort(!showSort)} className="icon-button" aria-label="Sort options">
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"></path></svg>
                    </button>
                    {showSort && (
                        <div className="sort-menu">
                            <button onClick={() => { setSortOrder('date-desc'); setShowSort(false); }}>Newest First</button>
                            <button onClick={() => { setSortOrder('date-asc'); setShowSort(false); }}>Oldest First</button>
                            <button onClick={() => { setSortOrder('title-asc'); setShowSort(false); }}>Title (A-Z)</button>
                            <button onClick={() => { setSortOrder('title-desc'); setShowSort(false); }}>Title (Z-A)</button>
                        </div>
                    )}
                </div>
            </div>
            <div className="tag-filters">
                {allTags.map(tag => (
                    <button key={tag} onClick={() => toggleTag(tag)} className={`tag-button ${selectedTags.includes(tag) ? 'active' : ''}`}>{tag}</button>
                ))}
            </div>
            <ProjectList projects={filteredProjects} onProjectSelect={onProjectSelect} />
        </main>
    );
};

const AnimatedSection: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => {
    const [ref, isVisible] = useAnimatedVisibility<HTMLDivElement>();
    return <div ref={ref} className={`${className || ''} animated-section ${isVisible ? 'visible' : ''}`}>{children}</div>;
};

// 파일: index.tsx

// [핵심 변경] 스크롤에 따라 개별 이미지를 애니메이션하기 위해 새로 추가된 컴포넌트입니다.
const AnimatedGalleryImage: React.FC<{
    src: string;
    alt: string;
    onClick: () => void;
}> = ({ src, alt, onClick }) => {
    // useAnimatedVisibility 훅을 사용하여 이미지가 화면에 보이는지 감지합니다.
    const [ref, isVisible] = useAnimatedVisibility<HTMLDivElement>();

    return (
        // 이미지를 div로 감싸고, isVisible 값에 따라 'visible' 클래스를 동적으로 추가합니다.
        <div
            ref={ref}
            className={`gallery-image-wrapper ${isVisible ? 'visible' : ''}`}
            onClick={onClick}
        >
            <img src={src} alt={alt} loading="lazy" />
        </div>
    );
};

const ProjectDetailPage: React.FC<{
    project: Project;
    onClose: () => void;
    onNavigate: (direction: 'prev' | 'next') => void;
}> = ({ project, onClose, onNavigate }) => {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
     useEffect(() => {
        window.scrollTo(0, 0);
    }, [project]);

    // 라이트박스의 상태에 따라 body의 스크롤을 제어하는 useEffect 훅입니다.
    useEffect(() => {
        if (lightboxIndex !== null) {
            // 라이트박스가 열리면 body의 overflow를 hidden으로 설정하여 배경 스크롤을 막습니다.
            document.body.style.overflow = 'hidden';
        } else {
            // 라이트박스가 닫히면 body의 overflow 스타일을 원래대로 되돌려 스크롤을 다시 허용합니다.
            document.body.style.overflow = '';
        }

        // 컴포넌트가 언마운트될 때(예: 다른 페이지로 이동 시) 스크롤이 잠겨있는 상태로 남지 않도록
        // 반드시 원래대로 되돌리는 cleanup 함수를 포함합니다.
        return () => {
            document.body.style.overflow = '';
        };
    }, [lightboxIndex]); // lightboxIndex 상태가 변경될 때마다 이 효과가 실행됩니다.

    // [기능 2] 라이트박스를 닫는 함수입니다. ('X' 버튼이나 배경 클릭 시 호출)
    // 이 함수의 역할을 명확하게 분리하여 안정성을 높였습니다.
    const closeLightbox = useCallback(() => {
        // 모바일에서 가로 모드로 전환된 상태(즉, 전체 화면 상태)일 경우,
        // 브라우저에 전체 화면 종료를 '요청'하기만 합니다.
        // 실제 화면 방향을 되돌리고 라이트박스를 닫는 작업(뒷정리)은 아래 useEffect의
        // 'fullscreenchange' 이벤트 핸들러가 일관되게 처리합니다.
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => console.warn("전체 화면 종료에 실패했습니다:", err));
        } else {
            // 전체 화면 모드가 아닌 경우 (예: 데스크탑에서 라이트박스를 열었을 때),
            // 이벤트 리스너를 기다릴 필요 없이 바로 라이트박스를 닫습니다.
            setLightboxIndex(null);
        }
    }, []); // 의존성이 없으므로 컴포넌트가 처음 렌더링될 때 한 번만 생성됩니다.

    // [기능 3] 사용자가 ESC 키 등으로 수동으로 전체 화면을 종료하는 경우를 처리
    // [핵심 변경] 'fullscreenchange' 이벤트를 감지하여 뒷정리를 담당하는 부분입니다.
    // 이 로직 덕분에 사용자가 'X' 버튼을 누르든, 스마트폰의 '뒤로 가기' 버튼을 누르든
    // 모든 전체 화면 종료 상황에서 동일하고 안정적인 처리가 보장됩니다.
    useEffect(() => {
        const handleFullscreenChange = () => {
            // 이벤트가 발생했을 때, 라이트박스가 열려있는 상태인데(lightboxIndex !== null)
            // 전체 화면이 아니라면(!document.fullscreenElement), 사용자가 전체 화면을 종료한 것입니다.
            if (lightboxIndex !== null && !document.fullscreenElement) {
                // 1. 화면 방향 잠금을 해제하여 원래대로(세로 모드) 되돌립니다.
                // 화면 방향 잠금 해제를 시도하기 전에, 현재 기기가 모바일 환경인지 다시 한번 확인합니다.
            // 화면 방향 잠금은 모바일에서만 발생했으므로, 해제 역시 모바일에서만 시도하는 것이
            // 가장 안전하고 논리적으로 명확합니다.
                const isMobile = window.matchMedia('(pointer: coarse)').matches; // 디바이스 크기가 아니라 터치기기인지로 모바일인지 판단. 모바일이더라도 가로모드는 768px 보다 클수 있기 때문
                if (isMobile && screen.orientation?.unlock) {
                    screen.orientation.unlock(); // 세로모드로 전환
                }
                // 2. 라이트박스 상태를 null로 변경하여 화면에서 숨깁니다.
                setLightboxIndex(null);
            }
        };

        // 이벤트 리스너를 등록합니다.
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        // 컴포넌트가 사라질 때 이벤트 리스너를 꼭 제거하여 메모리 누수를 방지합니다.
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
        // lightboxIndex가 변경될 때마다 이 effect를 재실행하여 핸들러가 최신 상태를 참조하도록 합니다.
    }, [lightboxIndex]);

    // [기능 1] 갤러리 이미지를 클릭했을 때 가로 모드로 전환하는 함수
    const openLightbox = async (index: number) => {
        // 모바일 환경(가로 768px 이하)인지 확인합니다.
        const isMobile = window.matchMedia('(pointer: coarse)').matches;
        if (isMobile) {
            try {
                // 전체 화면 모드로 전환을 요청합니다.
                if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                }
                // 화면 방향을 '가로(landscape)'로 고정하도록 요청합니다.
                if (screen.orientation && screen.orientation.lock) {
                    await screen.orientation.lock('landscape');
                }
            } catch (err) {
                console.warn("Could not enter fullscreen or lock orientation:", err);
            }
        }
        // 라이트박스 상태를 열림으로 변경하여 이미지를 표시합니다.
        setLightboxIndex(index);
    };

    // 라이트박스 내에서 이전/다음 이미지로 이동하는 함수
    const handleLightboxNavigate = (direction: 'prev' | 'next') => {
        if (lightboxIndex === null || !project.gallery?.length) return;
        const gallerySize = project.gallery.length;
        if (direction === 'next') {
            setLightboxIndex((prevIndex) => (prevIndex! + 1) % gallerySize);
        } else {
            setLightboxIndex((prevIndex) => (prevIndex! - 1 + gallerySize) % gallerySize);
        }
    };

    return (
        <article className="project-detail-page">
            <button onClick={onClose} className="back-button">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path></svg>
                Back to Projects
            </button>
            <AnimatedSection>
                <header className="detail-hero" style={{backgroundImage: `url(${project.imageUrl})`}}>
                    <div className="hero-overlay"></div>
                    <div className="hero-content">
                        <h1>{project.title}</h1>
                        {/* <p>{project.outcome}</p> */}
                        {project.links && (project.links.github || project.links.liveDemo || project.links.youtube) && (
                            <div className="project-links">
                                {project.links.github && (
                                    <a href={project.links.github} target="_blank" rel="noopener noreferrer">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.27a11 11 0 00-3.48 21.46c.55.1.73-.24.73-.53v-1.84c-3.03.65-3.67-1.47-3.67-1.47a2.89 2.89 0 00-1.2-1.59c-1-.68.08-.67.08-.67a2.28 2.28 0 011.66 1.12 2.33 2.33 0 003.19.91 2.28 2.28 0 01.68-1.42c-2.43-.28-5-1.18-5-5.42a4.24 4.24 0 011.12-2.95 3.93 3.93 0 01.1-2.9s.92-.3 3 1.12a10.2 10.2 0 015.48 0c2.1-1.42 3-1.12 3-1.12a3.93 3.93 0 01.1 2.9 4.24 4.24 0 011.12 2.95c0 4.25-2.55 5.14-5 5.42a2.6 2.6 0 01.73 2.02v3c0 .29.18.63.73.53A11 11 0 0012 1.27z"></path></svg>
                                        GitHub Repo
                                    </a>
                                )}
                                {project.links.liveDemo && (
                                    <a href={project.links.liveDemo} target="_blank" rel="noopener noreferrer">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-1 14H6c-.55 0-1-.45-1-1V9h14v8c0 .55-.45 1-1 1zm1-11H5V7c0-.55.45-1 1-1h12c.55 0 1 .45 1 1v2z"></path></svg>
                                        Live Demo
                                    </a>
                                )}
                                {project.links.youtube && (
                                    <a href={project.links.youtube} target="_blank" rel="noopener noreferrer">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21.58 7.19c-.23-.86-.9-1.52-1.76-1.76C18.25 5 12 5 12 5s-6.25 0-7.82.43c-.86.24-1.53.9-1.76 1.76C2 8.76 2 12 2 12s0 3.24.43 4.81c.23.86.9 1.52 1.76 1.76C5.75 19 12 19 12 19s6.25 0 7.82-.43c.86-.24 1.53.9 1.76-1.76C22 15.24 22 12 22 12s0-3.24-.42-4.81zM10 15.46V8.54L15.2 12 10 15.46z"></path></svg>
                                        YouTube
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </header>
            </AnimatedSection>
            
            <div className="detail-body-container">
                <AnimatedSection className="detail-meta">
                    <div><strong>Type</strong><span>{project.type}</span></div>
                    <div><strong>Duration</strong><span>{project.duration}</span></div>
                    <div><strong>Difficulty</strong><span>{project.difficulty}</span></div>
                    <div><strong>Role</strong><span>{project.role}</span></div>
                </AnimatedSection>

                <AnimatedSection className="detail-section newline">
                    <h2>Project Overview</h2>
                    <p>{project.description}</p>
                </AnimatedSection>

                <AnimatedSection className="detail-section">
                    <h2>Process</h2>
                    <ol className="process-list">
                        {project.process?.map((step, index) => <li key={index}>{step}</li>)}
                    </ol>
                </AnimatedSection>

                <AnimatedSection className="detail-section newline">
                    <h2>Challenges & Solutions</h2>
                    <p>{project.challenges}</p>
                </AnimatedSection>

                {project.gallery?.length > 0 && (
                    <AnimatedSection className="detail-section">
                        <h2>Gallery</h2>
                        <div className="detail-gallery">
                            {project.gallery.map((img, index) => 
                                <AnimatedGalleryImage
                                    key={index}
                                    src={img}
                                    alt={`${project.title} gallery image ${index + 1}`}
                                    onClick={() => openLightbox(index)}
                                />)
                                }
                        </div>
                    </AnimatedSection>
                )}

                <AnimatedSection className="detail-section">
                    <h2>Tech Stack & Tools</h2>
                    <div className="card-tags">
                        {project.stack?.map(tech => <span key={tech} className="tag">{tech}</span>)}
                    </div>
                </AnimatedSection>
            </div>
             <div className="detail-nav">
                <button onClick={() => onNavigate('prev')}>&larr; Previous Project</button>
                <button onClick={() => onNavigate('next')}>Next Project &rarr;</button>
            </div>
            {lightboxIndex !== null && project.gallery?.length > 0 && (
                <Lightbox
                    images={project.gallery}
                    currentIndex={lightboxIndex}
                    onClose={closeLightbox}
                    onNavigate={handleLightboxNavigate}
                />
            )}
        </article>
    );
};

const AboutPage: React.FC<{ socialLinks: SocialLinks }> = ({ socialLinks }) => {
    return (
        <main className="container page-content">
           <AnimatedSection className="about-page">
             <div className="about-content">
                 <div className="about-profile">
                    <div className="about-photo-container">
                        <img src="https://raw.githubusercontent.com/sssssqew/product-design-portfolio/refs/heads/main/imgs/profile/profile-img.png" alt="John Doe" className="about-photo" />
                    </div>
                    <div className="social-links">
                        {socialLinks.youtube && <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" title="YouTube"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.58 7.19c-.23-.86-.9-1.52-1.76-1.76C18.25 5 12 5 12 5s-6.25 0-7.82.43c-.86.24-1.53.9-1.76 1.76C2 8.76 2 12 2 12s0 3.24.43 4.81c.23.86.9 1.52 1.76 1.76C5.75 19 12 19 12 19s6.25 0 7.82-.43c.86-.24 1.53.9 1.76-1.76C22 15.24 22 12 22 12s0-3.24-.42-4.81zM10 15.46V8.54L15.2 12 10 15.46z"></path></svg></a>}
                        {socialLinks.linkedin && <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21 3H3C1.9 3 1 3.9 1 5v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM8 18H5V9h3v9zm-1.5-10.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM19 18h-3v-4.74c0-1.42-.6-2.08-1.56-2.08-1.21 0-1.44.88-1.44 2.08V18h-3V9h3v1.34h.04c.4-.71 1.39-1.34 2.96-1.34 3.22 0 3.5 2.11 3.5 4.89V18z"></path></svg></a>}
                        {socialLinks.github && <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" title="GitHub"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 1.27a11 11 0 00-3.48 21.46c.55.1.73-.24.73-.53v-1.84c-3.03.65-3.67-1.47-3.67-1.47a2.89 2.89 0 00-1.2-1.59c-1-.68.08-.67.08-.67a2.28 2.28 0 011.66 1.12 2.33 2.33 0 003.19.91 2.28 2.28 0 01.68-1.42c-2.43-.28-5-1.18-5-5.42a4.24 4.24 0 011.12-2.95 3.93 3.93 0 01.1-2.9s.92-.3 3 1.12a10.2 10.2 0 015.48 0c2.1-1.42 3-1.12 3-1.12a3.93 3.93 0 01.1 2.9 4.24 4.24 0 011.12 2.95c0 4.25-2.55 5.14-5 5.42a2.6 2.6 0 01.73 2.02v3c0 .29.18.63.73.53A11 11 0 0012 1.27z"></path></svg></a>}
                        {socialLinks.blog && <a href={socialLinks.blog} target="_blank" rel="noopener noreferrer" title="Blog"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"></path></svg></a>}
                        {socialLinks.email && <a href={`mailto:${socialLinks.email}`} title="Email"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"></path></svg></a>}
                    </div>
                 </div>
                <div className="about-text">
                    <h1>About Me</h1>
                    <p>
                        {/* I am a passionate and creative Frontend Developer and UX Designer with a decade of experience in building beautiful, functional, and user-centered digital experiences. My expertise lies at the intersection of design and technology, where I strive to create intuitive interfaces that not only look stunning but also perform flawlessly. */}
                        I am a passionate and creative Frontend Developer and UX Designer, eager to build impactful digital experiences. With a strong foundation in frontend development (1 year of dedicated experience) enriched by 2 years as a web development instructor and 6 months of product design study abroad, my expertise naturally bridges the gap between design and technology.
                    </p>
                    <p>
                        {/* From initial user research and wireframing to high-fidelity prototypes and pixel-perfect code, I manage the entire product design lifecycle. I thrive in collaborative environments and am dedicated to solving complex problems with elegant solutions. */}
                        My goal is to craft beautiful, functional, and user-centered interfaces that not only look stunning but also perform flawlessly. I bring a comprehensive understanding of the product design lifecycle, from user research and wireframing to high-fidelity prototypes and meticulous code implementation. I value collaborative environments and am driven to deliver elegant solutions for complex challenges.
                    </p>
                    <h3>Core Skills</h3>
                    <ul>
                        <li>UI/UX Design & Research</li>
                        <li>Responsive Web Design</li>
                        <li>Frontend Development (React, JavaScript)</li>
                        <li>Interaction Design & Prototyping</li>
                        <li>Component-Based Design (Figma)</li>
                        <li>Web Accessibility</li>
                        <li>Web Performance Optimization</li>
                        <li>Complex API Integration & Backend Connectivity</li>
                        <li>AI Tools for Design & Content</li>
                    </ul>
                </div>
            </div>
           </AnimatedSection>
        </main>
    );
};

const AdminLogin: React.FC<{
    setLoggedIn: (loggedIn: boolean) => void;
    adminPassword: string
}> = ({ setLoggedIn, adminPassword }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === adminPassword) {
            sessionStorage.setItem('admin-logged-in', 'true');
            setLoggedIn(true);
        } else {
            setError('Incorrect password.');
        }
    };
    return (
        <main className="container page-content">
            <form onSubmit={handleSubmit} className="admin-login-form">
                <h2>Admin Login</h2>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    aria-label="Admin password"
                />
                <button type="submit">Login</button>
                {error && <p className="error">{error}</p>}
            </form>
        </main>
    );
};

const ProjectForm: React.FC<{
    project?: Project;
    onSave: (project: Project) => void;
    onCancel: () => void;
    projectTypes: string[];
}> = ({ project, onSave, onCancel, projectTypes }) => {
    const [formData, setFormData] = useState<Omit<Project, 'id' | 'date'>>({
        title: project?.title || '',
        type: project?.type || 'Frontend',
        imageUrl: project?.imageUrl || '',
        duration: project?.duration || '',
        difficulty: project?.difficulty || 'Medium',
        outcome: project?.outcome || '',
        stack: project?.stack || [],
        tags: project?.tags || [],
        description: project?.description || '',
        role: project?.role || '',
        process: project?.process || [],
        challenges: project?.challenges || '',
        gallery: project?.gallery || [],
        links: project?.links || { github: '', liveDemo: '', youtube: '' },
    });
    const [imagePreview, setImagePreview] = useState<string | null>(project?.imageUrl || null);
    const [stackInput, setStackInput] = useState(project?.stack?.join(', ') || '');
    const [tagsInput, setTagsInput] = useState(project?.tags?.join(', ') || '');
    const [processInput, setProcessInput] = useState(project?.process?.join(', ') || '');
    const [galleryInput, setGalleryInput] = useState(project?.gallery?.join(', ') || '');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            links: {
                ...prev.links,
                [name]: value,
            }
        }));
    };
    
    const handleArrayInputChange = (value: string, field: keyof Omit<Project, 'id' | 'date'>, setInputState: React.Dispatch<React.SetStateAction<string>>) => {
        setInputState(value);
        setFormData(prev => ({ ...prev, [field]: value.split(',').map(s => s.trim()).filter(Boolean) }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setFormData(prev => ({ ...prev, imageUrl: base64String }));
                setImagePreview(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalProject: Project = {
            ...formData,
            id: project?.id || Date.now().toString(),
            date: project?.date || new Date().toISOString().split('T')[0],
        };
        onSave(finalProject);
    };

    return (
        <form onSubmit={handleSubmit} className="project-form">
            <h2>{project ? 'Edit Project' : 'Add New Project'}</h2>
            <div className="form-group">
                <label>Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required />
            </div>
            <div className="form-group">
                <label>Type</label>
                <select name="type" value={formData.type} onChange={handleChange}>
                    {projectTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            </div>
             <div className="form-group">
                <label>Cover Image</label>
                <input type="file" onChange={handleImageChange} accept="image/*" />
                {imagePreview && <img src={imagePreview} alt="Preview" className="image-preview" />}
            </div>
            <div className="form-group">
                <label>Image URL (or upload)</label>
                <input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleChange} />
            </div>
            <div className="form-group">
                <label>Duration</label>
                <input type="text" name="duration" value={formData.duration} onChange={handleChange} />
            </div>
            <div className="form-group">
                <label>Difficulty</label>
                <select name="difficulty" value={formData.difficulty} onChange={handleChange}>
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                    <option>Expert</option>
                </select>
            </div>
            <div className="form-group">
                <label>Outcome</label>
                <textarea name="outcome" value={formData.outcome} onChange={handleChange} rows={2}></textarea>
            </div>
            <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={4}></textarea>
            </div>
            <div className="form-group">
                <label>Role</label>
                <input type="text" name="role" value={formData.role} onChange={handleChange} />
            </div>
            <div className="form-group">
                <label>Process (comma-separated)</label>
                <input type="text" value={processInput} onChange={e => handleArrayInputChange(e.target.value, 'process', setProcessInput)} />
            </div>
            <div className="form-group">
                <label>Challenges</label>
                <textarea name="challenges" value={formData.challenges} onChange={handleChange} rows={3}></textarea>
            </div>
            <div className="project-links-form-section">
                <h3>Project Links</h3>
                <div className="form-group">
                    <label>GitHub Repository URL</label>
                    <input type="text" name="github" value={formData.links?.github || ''} onChange={handleLinkChange} placeholder="e.g., https://github.com/user/repo"/>
                </div>
                <div className="form-group">
                    <label>Live Demo URL</label>
                    <input type="text" name="liveDemo" value={formData.links?.liveDemo || ''} onChange={handleLinkChange} placeholder="e.g., https://example.com/demo"/>
                </div>
                <div className="form-group">
                    <label>YouTube URL</label>
                    <input type="text" name="youtube" value={formData.links?.youtube || ''} onChange={handleLinkChange} placeholder="e.g., https://youtube.com/watch?v=..."/>
                </div>
            </div>
            <div className="form-group">
                <label>Gallery Image URLs (comma-separated)</label>
                <input type="text" value={galleryInput} onChange={e => handleArrayInputChange(e.target.value, 'gallery', setGalleryInput)} />
            </div>
            <div className="form-group">
                <label>Tech Stack (comma-separated)</label>
                <input type="text" value={stackInput} onChange={e => handleArrayInputChange(e.target.value, 'stack', setStackInput)} />
            </div>
            <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input type="text" value={tagsInput} onChange={e => handleArrayInputChange(e.target.value, 'tags', setTagsInput)} />
            </div>
            <div className="form-actions">
                <button type="submit" className="button-primary">Save Project</button>
                <button type="button" onClick={onCancel}>Cancel</button>
            </div>
        </form>
    );
};

const AdminDashboard: React.FC<{
    projects: Project[];
    setProjects: (projects: Project[] | ((p: Project[]) => Project[])) => void;
    setAdminPassword: (password: string) => void;
    setLoggedIn: (loggedIn: boolean) => void;
    projectTypes: string[];
    setProjectTypes: (types: string[] | ((t: string[]) => string[])) => void;
    socialLinks: SocialLinks;
    setSocialLinks: (links: SocialLinks) => void;
}> = ({ projects, setProjects, setAdminPassword, setLoggedIn, projectTypes, setProjectTypes, socialLinks, setSocialLinks }) => {
    const [editingProject, setEditingProject] = useState<Project | null | 'new'>(null);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [localSocialLinks, setLocalSocialLinks] = useState<SocialLinks>(socialLinks);
    const [socialsMessage, setSocialsMessage] = useState('');
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);


    const handleSaveProject = (project: Project) => {
        setProjects(prevProjects => {
            const index = prevProjects.findIndex(p => p.id === project.id);
            if (index > -1) {
                const newProjects = [...prevProjects];
                newProjects[index] = project;
                return newProjects;
            }
            return [project, ...prevProjects];
        });
        setEditingProject(null);
    };
    
    const handleDeleteProject = (id: string) => {
        setProjects(prevProjects => prevProjects.filter(p => p.id !== id));
        setProjectToDelete(null);
    };
    
    const handleChangePassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setPasswordMessage('Passwords do not match.');
            return;
        }
        if (newPassword.length < 4) {
            setPasswordMessage('Password must be at least 4 characters long.');
            return;
        }
        setAdminPassword(newPassword);
        setPasswordMessage('Password changed successfully!');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordMessage(''), 3000);
    };

    const handleLogout = () => {
        sessionStorage.removeItem('admin-logged-in');
        setLoggedIn(false);
    };
    
    const handleDragSort = () => {
        const dragIndex = dragItem.current;
        const hoverIndex = dragOverItem.current;

        if (dragIndex === null || hoverIndex === null || dragIndex === hoverIndex) {
            dragItem.current = null;
            dragOverItem.current = null;
            return;
        }

        setProjects(currentProjects => {
            const reorderedProjects = [...currentProjects];
            const [draggedItem] = reorderedProjects.splice(dragIndex, 1);
            reorderedProjects.splice(hoverIndex, 0, draggedItem);
            return reorderedProjects;
        });

        dragItem.current = null;
        dragOverItem.current = null;
    };
    
    const handleExport = () => {
        const dataStr = JSON.stringify(projects, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = 'projects.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const handleAddCategory = () => {
        const trimmedCategory = newCategory.trim();
        if (!trimmedCategory) { // 빈 이름은 추가하지 않음
            alert('Category name cannot be empty.');
            return;
        }
        if (projectTypes.some(pt => pt.toLowerCase() === trimmedCategory.toLowerCase())) { // 중복 이름은 추가하지 않음
            alert('This category already exists.');
            return;
        }
        setProjectTypes(prev => [...prev, trimmedCategory]); // 상태 업데이트
        setNewCategory('');
    };

    const handleDeleteCategoryConfirmed = () => {
        if (!categoryToDelete) return;

        // 카테고리를 사용하는 프로젝트가 있는지 확인하여 실수를 방지합니다.
        const isUsed = projects.some(p => p.type === categoryToDelete);
        if (isUsed) {
            alert(`Cannot delete "${categoryToDelete}" because it is currently used by one or more projects.`);
            setCategoryToDelete(null);
            return;
        }

        setProjectTypes(prev => prev.filter(pt => pt !== categoryToDelete)); // 상태 업데이트
        setCategoryToDelete(null);
    };

    const handleSocialsSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSocialLinks(localSocialLinks);
        setSocialsMessage('Social links updated successfully!');
        setTimeout(() => setSocialsMessage(''), 3000);
    };

    const handleSocialsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalSocialLinks(prev => ({...prev, [name]: value}));
    };


    if (editingProject) {
        return (
            <main className="container page-content">
                <ProjectForm
                    project={editingProject === 'new' ? undefined : editingProject}
                    onSave={handleSaveProject}
                    onCancel={() => setEditingProject(null)}
                    projectTypes={projectTypes}
                />
            </main>
        );
    }
    
    return (
        <>
            <main className="container page-content admin-dashboard">
                <div className="admin-header">
                    <h2>Admin Dashboard</h2>
                    <div>
                      <button onClick={() => setEditingProject('new')} className="add-project-button" title="Add New Project" aria-label="Add new project">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg>
                      </button>
                      <button onClick={handleExport} className="export-button" title="Export projects.json" aria-label="Export projects.json">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z"></path></svg>
                      </button>
                      <button onClick={handleLogout} className="logout-button" title="Logout" aria-label="Logout">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"></path></svg>
                      </button>
                    </div>
                </div>
                
                <div className="admin-section">
                    <h3>Manage Projects</h3>
                    {projects.map((p, index) => (
                        <div 
                            key={p.id} 
                            className="admin-project-item"
                            draggable
                            onDragStart={(e) => {
                                if (e.target instanceof HTMLElement && e.target.closest('.item-actions')) {
                                    e.preventDefault();
                                    return;
                                }
                                dragItem.current = index
                            }}
                            onDragEnter={() => dragOverItem.current = index}
                            onDragEnd={handleDragSort}
                            onDragOver={(e) => e.preventDefault()}
                        >
                            <div className="drag-handle">::</div>
                            <span>{p.title} ({p.type})</span>
                            <div className="item-actions">
                                 <button 
                                    onClick={() => setEditingProject(p)} 
                                    className="icon-button" 
                                    title="Edit" 
                                    aria-label="Edit project"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                                </button>
                                <button 
                                    onClick={() => setProjectToDelete(p)} 
                                    className="icon-button delete" 
                                    title="Delete" 
                                    aria-label="Delete project"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="admin-section">
                    <h3>Manage Categories</h3>
                    {/* 현재 카테고리 목록을 보여주고, 각 항목마다 삭제 버튼을 만듭니다. */}
                    <div className="admin-category-list">
                        {projectTypes.map(type => (
                            <div key={type} className="admin-category-item">
                                <span>{type}</span>
                                <button
                                    onClick={() => setCategoryToDelete(type)}
                                    className="icon-button delete"
                                    title="Delete Category"
                                    aria-label={`Delete category ${type}`}
                                >
                                    {/* 삭제 아이콘 SVG */}
                                </button>
                            </div>
                        ))}
                    </div>
                    {/* 새로운 카테고리를 입력하는 input과 추가 버튼입니다. */}
                    <div className="admin-category-add">
                        <input
                            type="text"
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value)}
                            placeholder="New category name"
                            onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                        />
                        <button onClick={handleAddCategory}>Add Category</button>
                    </div>
                </div>

                <div className="admin-section">
                    <h3>Manage Social Links</h3>
                    <form onSubmit={handleSocialsSave}>
                        <div className="form-group">
                            <label>YouTube</label>
                            <input type="text" name="youtube" value={localSocialLinks.youtube} onChange={handleSocialsChange} placeholder="Full YouTube URL" />
                        </div>
                        <div className="form-group">
                            <label>LinkedIn</label>
                            <input type="text" name="linkedin" value={localSocialLinks.linkedin} onChange={handleSocialsChange} placeholder="Full LinkedIn URL" />
                        </div>
                        <div className="form-group">
                            <label>GitHub</label>
                            <input type="text" name="github" value={localSocialLinks.github} onChange={handleSocialsChange} placeholder="Full GitHub URL" />
                        </div>
                        <div className="form-group">
                            <label>Blog</label>
                            <input type="text" name="blog" value={localSocialLinks.blog} onChange={handleSocialsChange} placeholder="Full Blog URL" />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" name="email" value={localSocialLinks.email} onChange={handleSocialsChange} placeholder="your.email@example.com" />
                        </div>
                        <button type="submit">Save Social Links</button>
                    </form>
                    {socialsMessage && <p className="password-message">{socialsMessage}</p>}
                </div>

                <div className="admin-password-change">
                    <h3>Change Password</h3>
                    <form onSubmit={handleChangePassword}>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password" required />
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" required />
                        <button type="submit">Change Password</button>
                    </form>
                    {passwordMessage && <p className="password-message">{passwordMessage}</p>}
                </div>
            </main>

            <ConfirmationModal
                isOpen={!!categoryToDelete}
                onClose={() => setCategoryToDelete(null)}
                onConfirm={handleDeleteCategoryConfirmed}
                title="Confirm Category Deletion"
            >
                {categoryToDelete && <p>Are you sure you want to delete the category "{categoryToDelete}"? This action cannot be undone.</p>}
            </ConfirmationModal>

            <ConfirmationModal
                isOpen={!!projectToDelete}
                onClose={() => setProjectToDelete(null)}
                onConfirm={() => projectToDelete && handleDeleteProject(projectToDelete.id)}
                title="Confirm Deletion"
            >
                {projectToDelete && <p>Are you sure you want to delete the project "{projectToDelete.title}"? This action cannot be undone.</p>}
            </ConfirmationModal>
        </>
    );
};

// --- MAIN APP COMPONENT --- //

const App: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [adminPassword, setAdminPassword] = useLocalStorage<string>('admin-password', '0000');
    const [projectTypes, setProjectTypes] = useLocalStorage<string[]>('project-types', ['Frontend', 'UX Design', 'AI Creations']);
    const [socialLinks, setSocialLinks] = useLocalStorage<SocialLinks>('social-links', {
        youtube: 'https://www.youtube.com',
        linkedin: 'https://www.linkedin.com/in/johndoe',
        github: 'https://github.com/johndoe',
        blog: 'https://medium.com/@johndoe',
        email: 'john.doe@example.com',
    });
    const [loggedIn, setLoggedIn] = useState(() => !!sessionStorage.getItem('admin-logged-in'));
    const [activePage, setActivePage] = useState(projectTypes[0] || 'About');
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true);
        fetch(`${import.meta.env.BASE_URL}projects.json?t=${new Date().getTime()}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => setProjects(data))
            .catch(error => {
                console.error("Error fetching projects:", error);
                setProjects([]); // Set to empty array on error
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    // When projectTypes from localStorage changes, ensure activePage is still valid
    useEffect(() => {
        if (!loggedIn && !projectTypes.includes(activePage) && activePage !== 'About' && activePage !== 'AdminLogin' && activePage !== 'Admin') {
            setActivePage(projectTypes[0] || 'About');
        }
    }, [projectTypes, activePage, loggedIn]);

    const selectedProject = useMemo(() => {
        return projects.find(p => p.id === selectedProjectId) || null;
    }, [projects, selectedProjectId]);
    
    const handleNavigateProject = (direction: 'prev' | 'next') => {
        if (!selectedProject) return;

        const currentTypeProjects = projects.filter(p => p.type === selectedProject.type);
        const currentIndex = currentTypeProjects.findIndex(p => p.id === selectedProject.id);

        if (currentIndex === -1) return;

        let nextIndex;
        if (direction === 'next') {
            nextIndex = (currentIndex + 1) % currentTypeProjects.length;
        } else {
            nextIndex = (currentIndex - 1 + currentTypeProjects.length) % currentTypeProjects.length;
        }
        
        setSelectedProjectId(currentTypeProjects[nextIndex].id);
    };

    const renderPage = () => {
        if (isLoading) {
            return <div className="loading-fullscreen">Loading Portfolio...</div>;
        }

        // project.id를 key로 전달하여 프로젝트가 변경될 때마다
        // ProjectDetailPage 컴포넌트가 완전히 새로 마운트되도록 합니다.
        // 이렇게 하면 스크롤 위치나 애니메이션 상태가 이전 페이지의 영향을 받지 않고
        // 항상 깨끗하게 초기화되어 문제가 해결됩니다.
        if (selectedProject) {
            return <ProjectDetailPage 
                        key={selectedProject.id} // 프로젝트가 변경될때마다 페이지를 새로 그리고 애니메이션도 다시 시작함
                        project={selectedProject} 
                        onClose={() => setSelectedProjectId(null)}
                        onNavigate={handleNavigateProject}
                    />
        }

        if (loggedIn) {
             return <AdminDashboard 
                        projects={projects}
                        setProjects={setProjects}
                        setAdminPassword={setAdminPassword}
                        setLoggedIn={setLoggedIn}
                        projectTypes={projectTypes}
                        setProjectTypes={setProjectTypes}
                        socialLinks={socialLinks}
                        setSocialLinks={setSocialLinks}
                    />;
        }

        switch (activePage) {
            case 'About':
                return <AboutPage socialLinks={socialLinks}/>;
            case 'AdminLogin':
                return <AdminLogin setLoggedIn={setLoggedIn} adminPassword={adminPassword} />;
            default:
                if (projectTypes.includes(activePage)) {
                    return <PortfolioPage projects={projects} type={activePage} onProjectSelect={setSelectedProjectId} />;
                }
                // Fallback for unknown pages, defaulting to the first category
                return <PortfolioPage projects={projects} type={projectTypes[0] || ''} onProjectSelect={setSelectedProjectId}/>;
        }
    };
    
    useEffect(() => {
        if (loggedIn) {
            setActivePage('Admin');
            setSelectedProjectId(null); 
        } else if (activePage === 'Admin') {
            setActivePage('Frontend');
        }
    }, [loggedIn]);


    return (
        <>
            <Header activePage={activePage} setActivePage={setActivePage} isProjectOpen={!!selectedProject} projectTypes={projectTypes}/>
            {renderPage()}
        </>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
