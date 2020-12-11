import * as https from 'https';
import { RequestOptions } from 'https';
import { YAPIResponseObject } from '../interfaces';

/** 请求配置 */
interface RequestConfig {
  url: string;
  data: any;
}

export function request(options: RequestConfig): Promise<YAPIResponseObject> {
  return new Promise((resolve, reject) => {
    const reqURL = new URL(options.url);

    /** 请求对象 */
    const requestObj: RequestOptions = {
      hostname: reqURL.hostname,
      path: reqURL.pathname,
      port: 443,
      protocol: reqURL.protocol,
      method: 'POST',
      secureProtocol: 'TLSv1_method',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': options.data.length,
      },
    };

    /** 发送同步请求 */
    const request = https.request(requestObj, res => {
      let resData = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        resData += chunk;
      });
      res.on('end', () => {
        const data: YAPIResponseObject = JSON.parse(resData);
        if (data.errcode === 0) {
          resolve(data);
        } else {
          reject(data);
        }
      });
    });
    request.on('error', reject);
    request.end(options.data);
  });
}