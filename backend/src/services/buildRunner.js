// '배포용 파일 다시 만들기' 버튼이 실제로 하는 일입니다.
// 프로젝트 최상위에서 `python build.py` 를 실행합니다.
//
// 실행할 명령과 인자는 코드에 정해져 있습니다.
// 관리자가 입력한 글자는 명령에 섞이지 않으므로 다른 명령이 실행될 수 없습니다.
import { spawn } from 'node:child_process';
import { config, ROOT } from '../config.js';

const TIMEOUT_MS = 5 * 60 * 1000; // 5분

// 동시에 두 번 실행되지 않도록 막습니다.
let running = null;

function spawnBuild() {
  return new Promise((resolve) => {
    const child = spawn(config.pythonBin, ['build.py'], {
      cwd: ROOT,
      shell: false,
    });

    let output = '';
    const collect = (chunk) => {
      output += chunk.toString();
    };

    child.stdout.on('data', collect);
    child.stderr.on('data', collect);

    const timer = setTimeout(() => {
      child.kill();
      resolve({ ok: false, message: '시간이 너무 오래 걸려 중단했습니다.', output });
    }, TIMEOUT_MS);

    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({
        ok: false,
        message:
          `${config.pythonBin} 을(를) 실행하지 못했습니다: ${error.message}\n` +
          '파이썬이 설치되어 있는지 확인하거나 .env 의 PYTHON_BIN 을 고쳐 주세요.',
        output,
      });
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve(
        code === 0
          ? { ok: true, message: '배포용 index.html 을 다시 만들었습니다.', output }
          : { ok: false, message: `build.py 가 오류로 끝났습니다. (코드 ${code})`, output },
      );
    });
  });
}

export async function runBuild() {
  if (running) {
    return { ok: false, message: '이미 만드는 중입니다. 잠시 뒤에 다시 눌러 주세요.', output: '' };
  }

  running = spawnBuild();

  try {
    return await running;
  } finally {
    running = null;
  }
}
