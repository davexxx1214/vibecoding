import { Link } from "wouter";

export default function NotFound() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
            <div className="card w-96 bg-base-100 shadow-xl">
                <div className="card-body items-center text-center">
                    <h2 className="card-title text-9xl font-bold text-gray-300">404</h2>
                    <p className="text-2xl font-semibold text-gray-600 mb-4">Page Not Found</p>
                    <p className="text-gray-500 mb-8">
                        The page you are looking for doesn't exist or has been moved.
                    </p>
                    <div className="card-actions">
                        <Link href="/">
                            <a className="btn btn-primary">Go Home</a>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
