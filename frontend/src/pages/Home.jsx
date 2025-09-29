import { useEffect, useState } from 'react';

const apiUrl = import.meta.env.VITE_API_URL;

function Home() {
    const [status, setStatus] = useState('');

    useEffect(() => {
        fetch(`${apiUrl}/health`)
            .then(res => {
                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }
                return res.json();
            })
            .then(data => setStatus(data.status))
            .catch(err => {
                console.error(err);
                setStatus('error');
            });
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-bold">CareTracker</h1>
            <p className="mt-2">Backend status: {status}</p>
        </div>
    );
}

export default Home;
