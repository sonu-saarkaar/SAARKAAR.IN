import PageLayout from '../components/layout/PageLayout'
import '../index.css'

export default function Gallery() {
    const images = [
        'https://images.unsplash.com/photo-1542744173-8e7e53415bb0',
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b',
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
        'https://images.unsplash.com/photo-1558655146-d09347e0c766',
        'https://images.unsplash.com/photo-1518770660439-4636190af475'
    ]

    return (
        <PageLayout title="Gallery" subtitle="Visual Excellence">
            <div style={{ columns: '3 250px', gap: '20px' }}>
                {images.map((url, i) => (
                    <div key={i} style={{ marginBottom: '20px', breakInside: 'avoid', borderRadius: '8px', overflow: 'hidden' }}>
                        <img src={url} alt={`Gallery ${i}`} style={{ width: '100%', display: 'block' }} />
                    </div>
                ))}
            </div>
        </PageLayout>
    )
}
