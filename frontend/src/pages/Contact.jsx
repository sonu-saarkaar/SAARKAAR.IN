import PageLayout from '../components/layout/PageLayout'
import '../index.css'

export default function Contact() {
    return (
        <PageLayout title="Contact Us" subtitle="Start Your Project">
            <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                <div className="contact-info">
                    <h2>Let's Talk Business.</h2>
                    <p className="lead">We are open to partnerships, consultations, and new ventures.</p>

                    <div className="contact-details" style={{ marginTop: '30px' }}>
                        <div className="detail-item">
                            <strong>Email:</strong><br />
                            <span style={{ color: '#eebb44' }}>contact@saarkaar.in</span>
                        </div>
                        <div className="detail-item" style={{ marginTop: '20px' }}>
                            <strong>Phone:</strong><br />
                            <span>+91 98765 43210</span>
                        </div>
                        <div className="detail-item" style={{ marginTop: '20px' }}>
                            <strong>Address:</strong><br />
                            <span>Executive Tower, Cyber City<br />Gurugram, India</span>
                        </div>
                    </div>
                </div>

                <div className="contact-form-wrapper" style={{ background: 'rgba(255,255,255,0.05)', padding: '30px', borderRadius: '12px' }}>
                    <form>
                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#888' }}>Full Name</label>
                            <input type="text" style={{ width: '95%', padding: '12px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px' }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#888' }}>Email Address</label>
                            <input type="email" style={{ width: '95%', padding: '12px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px' }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#888' }}>Message</label>
                            <textarea rows="4" style={{ width: '95%', padding: '12px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px' }}></textarea>
                        </div>
                        <button type="submit" className="btn-cta" style={{ width: '100%' }}>Send Message</button>
                    </form>
                </div>
            </div>
        </PageLayout>
    )
}
