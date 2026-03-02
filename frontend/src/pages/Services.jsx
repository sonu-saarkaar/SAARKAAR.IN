import PageLayout from '../components/layout/PageLayout'
import '../index.css'

export default function Services() {
    const services = [
        {
            icon: '🚀',
            title: '3D Web Experiences',
            desc: 'We build immersive, interactive 3D websites using Three.js and React Fiber. Transform your brand into a virtual world.'
        },
        {
            icon: '🧠',
            title: 'AI Integration',
            desc: 'Custom AI solutions. Chatbots, voice assistants, and predictive models integrated seamlessly into your applications.'
        },
        {
            icon: '📱',
            title: 'Full Stack Development',
            desc: 'Robust, scalable web applications using the MERN stack. From database architecture to responsive frontend implementation.'
        },
        {
            icon: '🎨',
            title: 'UI/UX Design',
            desc: 'Premium, user-centric design that balances aesthetics with functionality. Design systems, prototyping, and user flows.'
        },
        {
            icon: '☁️',
            title: 'Cloud Solutions',
            desc: 'Deploy, scale, and manage your applications on AWS, Google Cloud, or Azure. Serverless architectures and CI/CD pipelines.'
        },
        {
            icon: '🔒',
            title: 'Cybersecurity',
            desc: 'Protect your digital assets with advanced security audits, penetration testing, and secure coding practices.'
        }
    ]

    return (
        <PageLayout title="Our Services" subtitle="Innovation & Excellence">
            <div className="grid-cols">
                {services.map((svc, i) => (
                    <div key={i} className="card service-card">
                        <div className="card-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>{svc.icon}</div>
                        <h3>{svc.title}</h3>
                        <p>{svc.desc}</p>
                        <a href="#" className="read-more" style={{ color: '#eebb44', textDecoration: 'none', fontWeight: 'bold' }}>Learn More →</a>
                    </div>
                ))}
            </div>
        </PageLayout>
    )
}
