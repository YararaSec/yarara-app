// app/scan/[id].tsx
'use client'; // Mark this as a Client Component

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Scan } from '@/types/interfaces';
import { Card } from '@/components/ui/card';



export default function ScanPage() {
  const { id } = useParams(); // Get the `id` from the URL
  const router = useRouter();
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    // Fetch scan data by ID
    const fetchScan = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BFF_URL}/api/scans/${id}`); // Replace with your API endpoint
        if (!response.ok) {
          throw new Error('Failed to fetch scan');
        }
        const data = await response.json();
        setScan(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchScan();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!scan) {
    return <div>Scan not found</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Scan Details</h1>
      <div className="space-y-4">
        <p><strong>Id:</strong> {scan._id}</p>
        <p><strong>Date:</strong> {new Date(scan.scanDate).toLocaleString()}</p>
        <p><strong>Vulnerabilities:</strong> {scan.vulnerabilitiesCount ? scan.vulnerabilitiesCount : 0}</p>
        <p><strong>Status:</strong> {scan.status}</p>
        <p><strong>Output:</strong> {scan.status}</p>
        <Card className="p-4 bg-gray-800 rounded-lg shadow-sm">
          {scan.output}
        </Card>

      </div>

      <button
        onClick={() => router.push('/dashboard')}
        className="mt-4 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
      >
        Back to Dashboard
      </button>
    </div>
  );
}