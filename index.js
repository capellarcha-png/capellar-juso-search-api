import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

console.log('Environment check:');
console.log('JUSO_API_KEY exists:', !!process.env.JUSO_API_KEY);
console.log('JUSO_API_KEY length:', process.env.JUSO_API_KEY?.length);

app.use(cors());
app.use(express.json());
app.use('/test', express.static(join(__dirname, 'test')));

// GET 방식 주소 검색 엔드포인트 추가
app.get('/search', async (req, res) => {
  try {
    const keyword = req.query.keyword;
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: '검색할 주소 키워드를 입력해주세요.'
      });
    }

    const apiKey = process.env.JUSO_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: '환경변수 JUSO_API_KEY가 설정되지 않았습니다.'
      });
    }

    const apiUrl = 'https://business.juso.go.kr/addrlink/addrLinkApi.do';
    const params = new URLSearchParams({
      confmKey: apiKey,
      currentPage: '1',
      countPerPage: '10',
      keyword: keyword,
      resultType: 'json'
    });

    const response = await fetch(`${apiUrl}?${params.toString()}`);
    const data = await response.json();

    if (data.results?.common?.errorCode !== '0') {
      const errorMsg = data.results?.common?.errorMessage || '주소 검색에 실패했습니다.';
      return res.status(400).json({
        success: false,
        message: errorMsg
      });
    }

    const juso = data.results?.juso;
    if (!juso || juso.length === 0) {
      return res.json({
        success: false,
        message: '검색 결과가 없습니다. 다른 키워드로 다시 검색해주세요.'
      });
    }

    return res.json({
      success: true,
      results: juso.map(address => ({
        roadAddr: address.roadAddr,
        jibunAddr: address.jibunAddr,
        zipNo: address.zipNo,
        bdNm: address.bdNm || ''
      }))
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    });
  }
});

// POST 방식 주소 검색 엔드포인트 (기존)
app.post('/api/search-address', async (req, res) => {
  try {
    const { keyword } = req.body;
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: '검색할 주소 키워드를 입력해주세요.'
      });
    }

    const apiKey = process.env.JUSO_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: '환경변수 JUSO_API_KEY가 설정되지 않았습니다. .env 파일을 확인해주세요.'
      });
    }

    const apiUrl = 'https://business.juso.go.kr/addrlink/addrLinkApi.do';
    const params = new URLSearchParams({
      confmKey: apiKey,
      currentPage: '1',
      countPerPage: '1',
      keyword: keyword,
      resultType: 'json'
    });

    const response = await fetch(`${apiUrl}?${params.toString()}`);
    const data = await response.json();

    if (data.results?.common?.errorCode !== '0') {
      const errorMsg = data.results?.common?.errorMessage || '주소 검색에 실패했습니다.';
      return res.status(400).json({
        success: false,
        message: errorMsg
      });
    }

    const juso = data.results?.juso;
    if (!juso || juso.length === 0) {
      return res.json({
        success: false,
        message: '검색 결과가 없습니다. 다른 키워드로 다시 검색해주세요.'
      });
    }

    const address = juso[0];
    const message = `${address.roadAddr}의 우편번호는 ${address.zipNo}입니다.${address.bdNm ? ` 건물명은 ${address.bdNm}입니다` : ''}`;

    return res.json({
      success: true,
      roadAddr: address.roadAddr,
      zipNo: address.zipNo,
      bdNm: address.bdNm || '',
      message: message
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    });
  }
});

app.get('/', (req, res) => {
  res.redirect('/test/index.html');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
