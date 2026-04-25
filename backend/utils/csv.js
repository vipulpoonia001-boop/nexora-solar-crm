import { Parser } from 'fast-csv';
import csvParser from 'csv-parser';
import { Readable } from 'node:stream';

export const generateCSV = (data, headers) => {
  const parser = new Parser({ headers });
  return parser.parse(data);
};

export const parseCSV = (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(buffer.toString());

    stream
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

export const leadCSVHeaders = [
  'name', 'phone', 'email', 'address', 'loadRequirement', 
  'source', 'status', 'followUpDate', 'notes'
];

export const projectCSVHeaders = [
  'customerName', 'phone', 'email', 'address', 'systemSize',
  'inverter', 'panelType', 'panelCount', 'stage', 'netMeterStatus', 'subsidyStatus'
];
