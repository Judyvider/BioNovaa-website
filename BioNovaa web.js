import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Mail, ArrowRight, Leaf, Dna, Globe, Users, Wifi, Upload, Handshake, Image as ImageIcon, Lightbulb, Loader2, ChevronDown, AlertTriangle, Info } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

// -----------------------------------------------------------------------------
// BioNovaa Website - Professional Live Version
// -----------------------------------------------------------------------------

// --- YOUR FIREBASE CONFIGURATION ---
const yourFirebaseConfig = {
  apiKey: "AIzaSyAuOcU7zDGjAjlmWQR_xaL8OyPsZylzprE",
  authDomain: "bionovaa-9d942.firebaseapp.com",
  projectId: "bionovaa-9d942",
  storageBucket: "bionovaa-9d942.firebasestorage.app",
  messagingSenderId: "747665072520",
  appId: "1:747665072520:web:eef2e8d247205076491a3d",
  measurementId: "G-8LJK8G8QVH"
};

// Initialize Firebase Services
let app, auth, db, storage, analytics;
try {
  app = initializeApp(yourFirebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  try {
    analytics = getAnalytics(app);
  } catch (err) {
    console.warn("Analytics initialization skipped:", err);
  }
} catch (e) {
  console.error("Firebase Init Error:", e);
}

// --- Custom Hook for Scroll Animations ---
const useScrollReveal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => setIsVisible(entry.isIntersecting));
    }, { threshold: 0.15 });

    const current = domRef.current;
    if (current) observer.observe(current);
    return () => {
      if (current) observer.unobserve(current);
    };
  }, []);

  return [domRef, isVisible];
};

const Reveal = ({ children, className = '' }) => {
  const [ref, isVisible] = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}
    >
      {children}
    </div>
  );
};

// ------------------------ Main Component -------------------------------------
const BioNovaaWebsite = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Firebase State
  const [user, setUser] = useState(null);
  const [galleryItems, setGalleryItems] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [authError, setAuthError] = useState(null);

  // --- 1. Authentication ---
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
        setAuthError(null);
      } catch (error) {
        console.warn("Auth Setup Issue:", error.code);
        if (error.code === 'auth/configuration-not-found' || error.code === 'auth/operation-not-allowed') {
            setAuthError({
                title: "Firebase Setup Required",
                message: "To enable uploads, go to Firebase Console > Authentication > Sign-in method and enable 'Anonymous'."
            });
        } else {
            setAuthError({
                title: "Authentication Error",
                message: error.message
            });
        }
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- 2. Real-time Database Listener ---
  useEffect(() => {
    if (!db) return;

    const q = query(collection(db, 'gallery_items'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      items.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setGalleryItems(items);
    }, (error) => {
      console.warn("Firestore access issue (check rules):", error.code);
    });

    return () => unsubscribe();
  }, []);

  // --- 3. Handle File Selection ---
  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewFile({ file, url, type: file.type });
  };

  // --- 4. Real File Upload to Firebase ---
  const handleFileUpload = async () => {
    if (!previewFile || !previewFile.file) return;
    if (!user) {
        alert("Authentication is required to upload. Please check the setup instructions at the top of the page.");
        return;
    }
    if (!storage) {
      alert("Storage connection not ready.");
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);

    try {
      const file = previewFile.file;
      const isVideo = file.type.startsWith('video/');
      
      const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      await addDoc(collection(db, 'gallery_items'), {
        url: downloadURL,
        title: isVideo ? "Community Video" : "Community Image",
        type: isVideo ? "video" : "image",
        timestamp: serverTimestamp(),
        uploadedBy: user.uid
      });

      setPreviewFile(null);
      alert("Upload Successful! Your content is live.");
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadError(`Upload failed: ${error.message}. Please check Firebase Storage Rules.`);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when gallery is open
  useEffect(() => {
    if (isGalleryOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
  }, [isGalleryOpen]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const contactEmail = 'bionnovaa@gmail.com';

  const navLinks = [
    { name: 'About', href: '#about' },
    { name: 'Hackathon', href: '#hackathon' },
    { name: 'Mission', href: '#mission' },
    { name: 'Partners', href: '#partners' },
    { name: 'Gallery', href: '#gallery', action: () => setIsGalleryOpen(true) },
    { name: 'Contact', href: '#contact' }
  ];

  return (
    <div className="min-h-screen bg-blue-50 font-sans text-slate-800 overflow-x-hidden">

      {/* --- Error Banner for Setup Issues --- */}
      {authError && (
        <div className="fixed top-0 left-0 w-full bg-orange-600 text-white p-4 z-[100] shadow-lg animate-in slide-in-from-top duration-500">
            <div className="container mx-auto flex items-start gap-3">
                <AlertTriangle size={24} className="flex-shrink-0 mt-1" />
                <div className="flex-1">
                    <h4 className="font-bold text-lg">{authError.title}</h4>
                    <p className="text-orange-100">{authError.message}</p>
                </div>
                <button onClick={() => setAuthError(null)} className="p-1 hover:bg-orange-700 rounded"><X size={20} /></button>
            </div>
        </div>
      )}

      {/* Gallery Overlay */}
      {isGalleryOpen && (
        <div className="fixed inset-0 z-[60] bg-blue-50/95 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-300">
          <div className="container mx-auto px-6 py-10">
            <div className="flex justify-between items-center mb-12 sticky top-0 bg-blue-50/95 backdrop-blur-md py-6 border-b border-blue-100 z-10 shadow-sm rounded-b-2xl">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Our Impact Gallery</h2>
                <p className="text-slate-500 text-sm">Visualizing our journey and ecosystem.</p>
              </div>
              <button
                onClick={() => setIsGalleryOpen(false)}
                className="p-2 bg-white hover:bg-slate-100 rounded-full text-slate-600 transition-colors shadow-sm"
              >
                <X size={32} />
              </button>
            </div>

            {/* Featured Video Section inside Gallery - Updated for Autoplay */}
            <div className="mb-12">
               <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-slate-100">
                  <video 
                    src="BioNovaa_slideshow_video.mp4" 
                    className="w-full h-auto max-h-[60vh] object-contain bg-black" 
                    controls 
                    autoPlay 
                    muted 
                    loop
                    playsInline
                  />
                  <div className="p-4">
                     <h3 className="text-xl font-bold text-slate-900">BioNovaa Highlights</h3>
                     <p className="text-slate-500 text-sm">A glimpse into our latest activities and impact.</p>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[250px] pb-12">
              
              {/* 1. Real Database Items */}
              {galleryItems.map((item) => (
                <div key={item.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white flex flex-col items-center justify-center text-center shadow-md hover:shadow-xl transition-all duration-500">
                  {item.type === 'video' ? (
                    <video controls className="absolute inset-0 w-full h-full object-cover">
                      <source src={item.url} type="video/mp4" />
                    </video>
                  ) : (
                    <img 
                      src={item.url} 
                      alt="Gallery Upload" 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <p className="text-white font-bold">{item.title}</p>
                  </div>
                </div>
              ))}

              {/* 2. Static placeholders */}
              {galleryItems.length === 0 && [
                'Online Hackathon Kickoff',
                'Virtual Team Collaboration',
                'Winning Solutions',
                'Expert Mentorship Sessions',
                'Community Impact',
                'Future Field Work'
              ].map((title, idx) => (
                <div key={`static-${idx}`} className={`group relative overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center p-6 text-center hover:border-green-400 hover:bg-green-50/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}>
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-slate-300 mb-4 group-hover:text-green-500 group-hover:scale-110 transition-all duration-300 shadow-sm">
                    <ImageIcon size={32} />
                  </div>
                  <h4 className="text-slate-500 font-bold group-hover:text-slate-800 transition-colors">{title}</h4>
                  <p className="text-xs text-slate-400 mt-2">Waiting for uploads...</p>
                </div>
              ))}
            </div>

            {/* Upload Section (REAL) */}
            <div className="bg-gradient-to-br from-white to-blue-50 border border-dashed border-blue-200 rounded-xl p-10 text-center mb-10 shadow-lg">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                {isUploading ? <Loader2 size={32} className="animate-spin" /> : <Upload size={32} />}
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2">Contribute to the Gallery</h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">Have photos or videos from the Hackathon? Upload them here to share with the ecosystem.</p>
              
              {uploadError && (
                <p className="text-red-600 bg-red-50 p-2 rounded mb-4 text-sm">{uploadError}</p>
              )}

              {/* Show warning if auth failed */}
              {!user && (
                  <div className="bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded-lg mb-4 text-sm inline-flex items-center gap-2">
                      <Info size={16} />
                      <span>Uploads are disabled until authentication is configured.</span>
                  </div>
              )}

              <div className="flex justify-center flex-col md:flex-row items-center gap-4">
                <label className={`cursor-pointer bg-green-400 hover:bg-green-500 text-white rounded-lg px-6 py-3 font-medium transition-all flex items-center gap-2 shadow-lg shadow-green-400/30 hover:-translate-y-1 ${isUploading || !user ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <Upload size={20} />
                  <span>{isUploading ? 'Uploading...' : 'Select File to Upload'}</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,video/mp4,video/webm"
                    disabled={isUploading || !user}
                    onChange={handleFileChange}
                  />
                </label>

                {/* Preview and upload button */}
                {previewFile && (
                  <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="w-40 h-28 rounded overflow-hidden border border-slate-200 shadow-sm bg-white">
                      {previewFile.type && previewFile.type.startsWith('video') ? (
                        <video src={previewFile.url} className="w-full h-full object-cover" muted loop />
                      ) : (
                        <img src={previewFile.url} alt="preview" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={handleFileUpload} disabled={isUploading || !user} className="px-4 py-2 bg-green-500 text-white rounded-lg font-bold shadow hover:bg-green-600 disabled:opacity-50 transition-colors">
                        {isUploading ? 'Sending...' : 'Confirm Upload'}
                      </button>
                      <button onClick={() => setPreviewFile(null)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

              </div>

              <p className="text-slate-400 text-xs mt-4">Supported formats: PNG, JPG, JPEG, MP4, WEBM.</p>
            </div>

            <div className="text-center pb-10">
              <button
                onClick={() => setIsGalleryOpen(false)}
                className="px-8 py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-lg"
              >
                Close Gallery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-blue-50/95 backdrop-blur-md shadow-md py-3' : 'bg-transparent py-5'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">

          {/* Logo - Fixed: Using BIONOVAA.jpg with Smart Container */}
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo(0,0)}>
            {/* We use a white pill container when not scrolled (on dark hero) to ensure the 
              JPG logo (white background) looks deliberate and clean. 
              When scrolled (on light navbar), we remove the background and use blend mode 
              so the white background of the JPG disappears.
            */}
            <div className={`transition-all duration-300 px-3 py-1.5 rounded-lg ${scrolled ? '' : 'bg-white/95 shadow-lg backdrop-blur-sm'}`}>
              <img 
                src="BIONOVAA.jpg" 
                alt="BioNovaa Logo" 
                className={`h-10 md:h-12 w-auto object-contain ${scrolled ? 'mix-blend-multiply' : ''}`} 
              />
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  if (link.action) {
                    e.preventDefault();
                    link.action();
                  }
                }}
                className={`font-medium relative group py-2 ${scrolled ? 'text-slate-600' : 'text-slate-200'}`}>
                <span className={`relative z-10 transition-colors ${scrolled ? 'group-hover:text-green-400' : 'group-hover:text-white'}`}>{link.name}</span>
                <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${scrolled ? 'bg-green-400' : 'bg-white'}`}></span>
              </a>
            ))}

            <a href={`mailto:${contactEmail}`} className={`px-6 py-2.5 rounded-full font-semibold transition-all transform hover:scale-105 shadow-md hover:shadow-lg flex items-center gap-2 ${scrolled ? 'bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white' : 'bg-white text-green-500 hover:bg-blue-50'}`}>
              <Mail size={16} /> Get in Touch
            </a>
          </div>

          <button onClick={toggleMenu} className={`md:hidden focus:outline-none p-2 rounded-md transition-colors ${scrolled ? 'text-green-600 hover:bg-green-50' : 'text-white hover:bg-white/10'}`}>
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-blue-50 shadow-xl border-t border-slate-100 py-4 px-6 flex flex-col space-y-4 animate-in slide-in-from-top-5 duration-200">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} onClick={(e) => { setIsMenuOpen(false); if (link.action) { e.preventDefault(); link.action(); } }} className="text-slate-700 font-medium hover:text-green-600 hover:bg-blue-100 py-3 px-2 rounded-lg transition-colors cursor-pointer">
                {link.name}
              </a>
            ))}
            <a href={`mailto:${contactEmail}`} className="text-center w-full py-3 bg-green-400 text-white rounded-lg font-bold shadow-md">Email Us</a>
          </div>
        )}
      </nav>

      {/* Hero Section (Content) - Video removed, standard hero active */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1516253564287-947867563886?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" alt="Sustainable Innovation" className="w-full h-full object-cover" />
          {/* Deep Matte Dark Navy/Black Overlay */}
          <div className="absolute inset-0 bg-slate-900/95"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center lg:text-left">
          <div className="lg:max-w-3xl">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-400/20 border border-green-400/30 text-green-300 text-xs font-bold tracking-wide uppercase shadow-sm mb-6 backdrop-blur-sm">
                <Leaf size={14} /> Sustainable Science & Innovation
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
                Revolutionizing <br />
                <span className="text-green-400">Africa’s Food Systems</span>
              </h1>

              <p className="text-lg lg:text-xl text-slate-300 mb-8 leading-relaxed max-w-lg">
                BioNovaa is an ecosystem dedicated to bridging critical gaps in the food industry. We turn waste into wealth and passive observation into active problem-solving.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a href="https://whatsapp.com/channel/0029VbBVcfv0LKZKE9g9ZO3h" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-green-400 hover:bg-green-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-400/25 flex items-center justify-center gap-2 transform hover:-translate-y-1 hover:shadow-green-400/40">
                  Join the Ecosystem <ArrowRight size={18} />
                </a>
                <button onClick={() => setIsGalleryOpen(true)} className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-xl font-bold transition-all backdrop-blur-sm flex items-center justify-center gap-2">
                  <ImageIcon size={18} /> View Gallery
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-blue-50 border-b border-green-100/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-100/30 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Our Impact Goals</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-green-400 to-blue-500 mx-auto mt-3 rounded-full"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Innovators', value: '500+', icon: <Users size={24} /> },
              { label: 'Countries', value: '12+', icon: <Globe size={24} /> },
              { label: 'Solutions', value: '100+', icon: <Lightbulb size={24} /> },
              { label: 'Partners', value: '5+', icon: <Handshake size={24} /> }
            ].map((stat, idx) => (
              <Reveal key={idx} className="text-center group cursor-default">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-white shadow-md mb-3 text-slate-400 group-hover:text-green-500 group-hover:scale-110 transition-all duration-300 border border-slate-100">{stat.icon}</div>
                <div className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">{stat.value}</div>
                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Who We Are */}
      <section id="about" className="py-24 bg-blue-50 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-20 left-0 w-1/3 h-full bg-blue-100/30 skew-x-12 -z-0"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <Reveal className="lg:w-1/2 relative group">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-green-100 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-blue-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
              <img src="https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="Community Collaboration" className="relative rounded-2xl shadow-xl w-full object-cover h-[400px] transition-transform duration-500 group-hover:scale-[1.02] border-4 border-white" />
            </Reveal>

            <Reveal className="lg:w-1/2">
              <h2 className="text-green-500 font-bold text-sm uppercase tracking-widest mb-3">Who We Are</h2>
              <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight">More Than an Organization,<br />An <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500">Ecosystem.</span></h3>
              <p className="text-slate-600 mb-8 text-lg leading-relaxed">BioNovaa is a dynamic ecosystem of innovators, students, and problem-solvers united by a single purpose: to bridge the critical gaps in the food industry and transform how Africa feeds itself.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-white hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-slate-100">
                  <div className="p-3 bg-blue-100 text-blue-900 rounded-lg">
                    <Globe size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Pan-African</h4>
                    <p className="text-sm text-slate-500">Connecting innovators across the continent.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-white hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-slate-100">
                  <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                    <Users size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Youth-Led</h4>
                    <p className="text-sm text-slate-500">Students & problem-solvers united.</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Hackathon */}
      <section id="hackathon" className="py-24 bg-slate-900 relative overflow-hidden text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#4ade80 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        <div className="container mx-auto px-6 relative z-10">
          <Reveal className="max-w-4xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 p-2 pr-4 rounded-full bg-slate-800 border border-slate-700 text-green-400 shadow-sm mb-6">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-xs font-bold uppercase tracking-wider">Live Foundation</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Our Foundation: <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">The Online Hackathon</span></h2>
            <p className="text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">At the heart of our ecosystem is the <span className="font-bold text-white">Online</span> Food Systems Hackathon. Connecting minds virtually to solve real-world problems.</p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[ { title: 'Identify Challenges', desc: 'We bring together the brightest minds to spot systemic issues.', icon: '🔍', color: 'text-blue-400' }, { title: 'Co-Create Solutions', desc: 'Turning passive observation into active problem-solving.', icon: '🤝', color: 'text-green-400' }, { title: 'Spark Change', desc: 'Building actionable solutions for a resilient future.', icon: '🚀', color: 'text-purple-400' } ].map((item, idx) => (
              <Reveal key={idx} className="bg-slate-800/50 backdrop-blur border border-slate-700 p-8 rounded-2xl hover:bg-slate-800 hover:border-green-400/50 hover:-translate-y-2 transition-all duration-300 group hover:shadow-lg">
                <div className={`text-4xl mb-6 ${item.color} transform group-hover:scale-110 transition-transform`}>{item.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-slate-400 group-hover:text-slate-300">{item.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section id="mission" className="py-24 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16">
            <Reveal>
              <h2 className="text-green-500 font-bold tracking-widest uppercase mb-4">Our Mission</h2>
              <h3 className="text-3xl font-bold mb-6 text-slate-900">Sustainable Innovation for Uplifted Communities</h3>
              <p className="text-slate-600 text-lg leading-relaxed mb-8">To build an ecosystem that drives sustainable innovation, converting food system challenges into opportunities that uplift communities, protect the environment, and create lasting economic value.</p>
              <ul className="space-y-4">
                {['Protect the Environment', 'Create Economic Value', 'Uplift Communities'].map((item) => (
                  <li key={item} className="flex items-center gap-3 group cursor-default p-3 rounded-xl hover:bg-white hover:shadow-sm transition-all duration-300">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center group-hover:bg-green-400 group-hover:text-white transition-colors">
                      <Leaf size={16} />
                    </div>
                    <span className="font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">{item}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal className="bg-white p-10 rounded-3xl border border-slate-100 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-full -mr-10 -mt-10"></div>
              <h2 className="text-blue-600 font-bold tracking-widest uppercase mb-4">Why We Exist</h2>
              <h3 className="text-2xl font-bold mb-6 text-slate-900">Bridging the Gap</h3>
              <p className="text-slate-600 mb-8">The African food industry is fragmented, with massive gaps between potential and reality. BioNovaa exists to bridge these gaps.</p>
              <div className="space-y-6">
                <div className="flex gap-6 items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-xl border border-slate-100 shadow-sm flex items-center justify-center text-slate-900 font-bold text-xl">1</div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">Dismantle Inefficiencies</h4>
                    <p className="text-slate-500 text-sm mt-1">Targeting waste and supply chain breaks.</p>
                  </div>
                </div>
                <div className="flex gap-6 items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-xl border border-slate-100 shadow-sm flex items-center justify-center text-green-500 font-bold text-xl">2</div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">Empower New Generations</h4>
                    <p className="text-slate-500 text-sm mt-1">Taking ownership of the agricultural future.</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section id="partners" className="py-24 bg-blue-50 relative">
        <div className="container mx-auto px-6 text-center relative z-10">
          <Reveal>
            <div className="inline-block p-4 rounded-full bg-white border border-slate-100 text-green-600 shadow-sm mb-6">
              <Handshake size={32} />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Our Partners</h2>
            <p className="text-slate-600 max-w-2xl mx-auto mb-16">Collaborating with organizations to drive impactful change across the ecosystem.</p>
          </Reveal>

          <Reveal className="flex justify-center flex-wrap gap-8">
            <div className="group bg-white p-10 rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-300 border border-slate-100 w-80 flex flex-col items-center transform hover:-translate-y-2">
              <div className="w-48 h-48 mb-6 flex items-center justify-center transition-all duration-500">
                <img src="FTS.jpg" alt="Food Technologist Society Logo" className="max-w-full max-h-full object-contain transform group-hover:scale-105 transition-transform duration-500" />
              </div>
              <h4 className="font-bold text-slate-900 text-xl mb-1">Food Technologist Society</h4>
              <div className="h-1 w-12 bg-green-400 rounded-full mb-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <p className="text-slate-500 font-medium">(FTSK)</p>
              <p className="text-green-500 text-xs font-bold mt-4 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full">Strategic Partner</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <Reveal className="max-w-3xl mx-auto">
            <div className="w-24 h-24 bg-white/5 border border-white/10 text-green-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl backdrop-blur-sm">
              <Mail size={40} />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Innovate?</h2>
            <p className="text-slate-300 mb-12 text-xl leading-relaxed">Whether you are an innovator, researcher, or organization, we want to hear from you. Join us in transforming Africa's food systems.</p>
            <a href={`mailto:${contactEmail}`} className="inline-flex items-center gap-3 px-12 py-5 bg-green-400 hover:bg-green-500 text-white font-bold rounded-full text-lg transition-all shadow-lg shadow-green-400/30 hover:-translate-y-1 transform">
              <Mail size={22} />
              {contactEmail}
            </a>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-50 text-slate-600 py-12 border-t border-slate-200">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="mb-6 md:mb-0 text-center md:text-left">
              <div className="flex items-center gap-2 mb-2 justify-center md:justify-start hover:opacity-100 transition-opacity">
                {/* Footer Logo - Fixed: Raw Image Display */}
                <img 
                  src="BIONOVAA.jpg" 
                  alt="BioNovaa Logo" 
                  className="h-10 w-auto object-contain mix-blend-multiply" 
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-center text-sm font-medium">
              <a href="#about" className="hover:text-green-500 transition-colors">About</a>
              <a href="#mission" className="hover:text-green-500 transition-colors">Mission</a>
              <a href="#partners" className="hover:text-green-500 transition-colors">Partners</a>
              <a href={`mailto:${contactEmail}`} className="hover:text-green-500 transition-colors px-4 py-2 bg-white rounded-full shadow-sm">{contactEmail}</a>
            </div>

            <div className="text-xs text-slate-400">&copy; {new Date().getFullYear()} BioNovaa. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BioNovaaWebsite;