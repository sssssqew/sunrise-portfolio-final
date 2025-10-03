
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// --- DATA & TYPES --- //

type ProjectType = 'Frontend' | 'UX Design';

interface Project {
  id: string;
  title: string;
  type: ProjectType;
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
}> = ({ activePage, setActivePage, isProjectOpen }) => {
    return (
        <header className={`header ${isProjectOpen ? 'hidden' : ''}`}>
            <div className="container">
                <div className="logo" onClick={() => setActivePage('Frontend')}>
                    <span>JOHN DOE</span>
                </div>
                <nav>
                    <ul>
                        <li className={activePage === 'Frontend' ? 'active' : ''} onClick={() => setActivePage('Frontend')}>Frontend</li>
                        <li className={activePage === 'UX Design' ? 'active' : ''} onClick={() => setActivePage('UX Design')}>UX Design</li>
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

// --- PAGES / VIEWS --- //

const PortfolioPage: React.FC<{ projects: Project[], type: ProjectType, onProjectSelect: (id: string) => void }> = ({ projects, type, onProjectSelect }) => {
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

const ProjectDetailPage: React.FC<{
    project: Project;
    onClose: () => void;
    onNavigate: (direction: 'prev' | 'next') => void;
}> = ({ project, onClose, onNavigate }) => {
     useEffect(() => {
        window.scrollTo(0, 0);
    }, [project]);

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
                        <p>{project.outcome}</p>
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
                            {project.gallery.map((img, index) => <img key={index} src={img} alt={`${project.title} gallery image ${index + 1}`} loading="lazy" />)}
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
        </article>
    );
};

const AboutPage: React.FC = () => {
    return (
        <main className="container page-content">
           <AnimatedSection className="about-page">
             <div className="about-content">
                 <img src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzOT二次MDd8MHwxfHNlYXJjaHwxfHxwb3J0Zm9saW8lMjB3ZWJzaXRlfGVufDB8fHx8MTcxNzI3NzAzNHww&ixlib=rb-4.0.3&q=80&w=1080" alt="John Doe" className="about-photo" />
                <div className="about-text">
                    <h1>About Me</h1>
                    <p>
                        I am a passionate and creative Frontend Developer and UX Designer with a decade of experience in building beautiful, functional, and user-centered digital experiences. My expertise lies at the intersection of design and technology, where I strive to create intuitive interfaces that not only look stunning but also perform flawlessly.
                    </p>
                    <p>
                        From initial user research and wireframing to high-fidelity prototypes and pixel-perfect code, I manage the entire product design lifecycle. I thrive in collaborative environments and am dedicated to solving complex problems with elegant solutions.
                    </p>
                    <h3>Core Skills</h3>
                    <ul>
                        <li>UI/UX Design & Research</li>
                        <li>Responsive Web Design</li>
                        <li>Frontend Development (React, TypeScript, Vue)</li>
                        <li>Interaction Design & Prototyping</li>
                        <li>Design Systems & Component Libraries</li>
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
}> = ({ project, onSave, onCancel }) => {
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
                    <option value="Frontend">Frontend</option>
                    <option value="UX Design">UX Design</option>
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
}> = ({ projects, setProjects, setAdminPassword, setLoggedIn }) => {
    const [editingProject, setEditingProject] = useState<Project | null | 'new'>(null);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');
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


    if (editingProject) {
        return (
            <main className="container page-content">
                <ProjectForm
                    project={editingProject === 'new' ? undefined : editingProject}
                    onSave={handleSaveProject}
                    onCancel={() => setEditingProject(null)}
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
                
                <div className="admin-projects-list">
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
    const [loggedIn, setLoggedIn] = useState(() => !!sessionStorage.getItem('admin-logged-in'));
    const [activePage, setActivePage] = useState('Frontend');
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

        if (selectedProject) {
            return <ProjectDetailPage 
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
                    />;
        }

        switch (activePage) {
            case 'Frontend':
                return <PortfolioPage projects={projects} type="Frontend" onProjectSelect={setSelectedProjectId} />;
            case 'UX Design':
                return <PortfolioPage projects={projects} type="UX Design" onProjectSelect={setSelectedProjectId}/>;
            case 'About':
                return <AboutPage />;
            case 'AdminLogin':
                return <AdminLogin setLoggedIn={setLoggedIn} adminPassword={adminPassword} />;
            default:
                return <PortfolioPage projects={projects} type="Frontend" onProjectSelect={setSelectedProjectId}/>;
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
            <Header activePage={activePage} setActivePage={setActivePage} isProjectOpen={!!selectedProject} />
            {renderPage()}
        </>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
