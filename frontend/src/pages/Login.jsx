import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const result = login(formData.username, formData.password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-lg shadow-lg">
              <Cpu className="h-12 w-12 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">ROBOPILOT</h2>
          <p className="mt-2 text-sm text-gray-600">
            로봇 및 드론 통합 관제 시스템
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                아이디
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                placeholder="아이디를 입력하세요"
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                placeholder="비밀번호를 입력하세요"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-md"
            >
              로그인
            </button>
          </form>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              className="text-xs text-gray-500 hover:text-gray-700 w-full text-center"
            >
              {showHint ? '테스트 계정 숨기기 ▲' : '테스트 계정 보기 ▼'}
            </button>

            {showHint && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-2">테스트 계정:</p>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">시스템 관리자:</span>
                    <code className="bg-white px-2 py-1 rounded border">admin / admin123</code>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">회사 관리자:</span>
                    <code className="bg-white px-2 py-1 rounded border">company1 / company123</code>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">운영자:</span>
                    <code className="bg-white px-2 py-1 rounded border">operator1 / operator123</code>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-500">
          © 2025 ROBOPILOT. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default Login;
