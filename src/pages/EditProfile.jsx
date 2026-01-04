import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { ArrowLeft, User, Save, Camera, X, Check } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/canvasUtils';

const EditProfile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [displayName, setDisplayName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    // Cropping State
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isCropping, setIsCropping] = useState(false);
    const [processingCrop, setProcessingCrop] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchProfile = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('display_name, avatar_url')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;
                if (data) {
                    setDisplayName(data.display_name || '');
                    setAvatarUrl(data.avatar_url);
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user, navigate]);

    // 1. Select File -> Read as Data URL -> Open Cropper
    const onFileSelect = async (event) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageSrc(reader.result);
                setIsCropping(true);
                // Reset file input value so same file can be selected again if needed
                event.target.value = null;
            });
            reader.readAsDataURL(file);
        }
    };

    const onCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    // 2. Confirm Crop -> Generate Blob -> Upload
    const onUploadCroppedImage = async () => {
        try {
            setProcessingCrop(true);
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

            // Construct a file name
            const fileName = `${user.id}-${Date.now()}.jpg`;
            const filePath = `${fileName}`; // root of bucket or subfolder

            // Upload to Supabase
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, croppedImageBlob);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setAvatarUrl(data.publicUrl);
            setIsCropping(false);
            setImageSrc(null);
            setMessage('Photo updated! Click Save Changes to finish.');

        } catch (e) {
            console.error(e);
            setMessage('Error uploading image: ' + e.message);
        } finally {
            setProcessingCrop(false);
        }
    };

    const onCancelCrop = () => {
        setIsCropping(false);
        setImageSrc(null);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            const updates = {
                id: user.id,
                display_name: displayName,
                avatar_url: avatarUrl,
                // updated_at: new Date(), // removed because column doesn't exist in DB
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(updates);

            if (error) throw error;
            setMessage('Profile updated successfully!');
            setTimeout(() => navigate('/'), 1500);
        } catch (error) {
            setMessage('Error updating profile: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

    return (
        <div style={{ padding: '1rem', maxWidth: '500px', margin: '0 auto' }}>
            <button
                onClick={() => navigate(-1)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#666', marginBottom: '2rem', fontSize: '1rem' }}
            >
                <ArrowLeft size={20} /> Back
            </button>

            {/* Main Edit Form */}
            {!isCropping ? (
                <div className="card-container" style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>

                        {/* Avatar Upload UI */}
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                background: '#f0f0f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid #eee'
                            }}>
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt="Avatar"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <User size={40} color="#999" />
                                )}
                            </div>
                            <label
                                htmlFor="avatar-upload"
                                style={{
                                    position: 'absolute',
                                    bottom: '-5px',
                                    right: '-5px',
                                    background: '#242424',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '30px',
                                    height: '30px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    border: '2px solid white'
                                }}
                            >
                                <Camera size={16} />
                            </label>
                            <input
                                type="file"
                                id="avatar-upload"
                                accept="image/*"
                                onChange={onFileSelect}
                                style={{ display: 'none' }}
                            />
                        </div>

                        <h2 style={{ margin: 0 }}>Edit Profile</h2>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#444' }}>
                                Display Name
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="How friends see you (e.g. Angela)"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #ddd',
                                    fontSize: '1rem',
                                    boxSizing: 'border-box'
                                }}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#444' }}>
                                Email
                            </label>
                            <input
                                type="email"
                                value={user?.email}
                                disabled
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #eee',
                                    background: '#f9f9f9',
                                    color: '#888',
                                    fontSize: '1rem',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '4px' }}>Email cannot be changed.</p>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="button-primary"
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: 'none',
                                background: '#242424',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                cursor: saving ? 'wait' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <Save size={18} />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>

                        {message && (
                            <div style={{
                                marginTop: '1rem',
                                padding: '10px',
                                borderRadius: '8px',
                                textAlign: 'center',
                                background: message.includes('Error') ? '#fee2e2' : '#dcfce7',
                                color: message.includes('Error') ? '#dc2626' : '#166534'
                            }}>
                                {message}
                            </div>
                        )}
                    </form>
                </div>
            ) : (
                /* Cropping UI Overlay */
                <div className="cropper-container" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'black',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div className="crop-area" style={{ position: 'relative', flex: 1, background: '#333' }}>
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                        />
                    </div>

                    <div className="crop-controls" style={{
                        padding: '20px',
                        background: 'black',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <button
                            onClick={onCancelCrop}
                            style={{
                                background: 'none',
                                border: '1px solid #666',
                                color: 'white',
                                borderRadius: '50px',
                                padding: '10px 20px',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>

                        <div style={{ color: 'white', fontSize: '0.9rem' }}>Drag to crop</div>

                        <button
                            onClick={onUploadCroppedImage}
                            disabled={processingCrop}
                            style={{
                                background: 'white',
                                border: 'none',
                                color: 'black',
                                borderRadius: '50px',
                                padding: '10px 20px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                opacity: processingCrop ? 0.7 : 1
                            }}
                        >
                            {processingCrop ? 'Saving...' : 'Done'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditProfile;
