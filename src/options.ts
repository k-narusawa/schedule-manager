'use strict';

import './options.css'; // ビルド時に読み込まれるのはここ

(async function () {
  const createHTML = async () => {
    // ヘッダ部分の生成
    const subjectDiv = document.getElementById('subject')!;
    const subject = document.createElement('p');
    subject.innerText = chrome.i18n.getMessage('application_name');
    subjectDiv.appendChild(subject);

    // input部分の生成
    const storage = await chrome.storage.local.get();

    const fetchSizeInputLabel = document.createElement('label');
    fetchSizeInputLabel.htmlFor = 'fetch-size-input';
    fetchSizeInputLabel.innerText =
      chrome.i18n.getMessage('options_fetch_size');
    const fetchSizeInput = document.createElement('input');
    fetchSizeInput.id = 'fetch-size-input';
    fetchSizeInput.className = 'fetch-size-input';
    fetchSizeInput.type = 'number';
    fetchSizeInput.min = '1';
    fetchSizeInput.max = '15';
    fetchSizeInput.defaultValue = storage.maxResults;

    const saveButton = document.createElement('button');
    saveButton.id = 'save';
    saveButton.className = 'save-button';
    saveButton.innerText = '保存';

    document.getElementById('options-form')!.appendChild(fetchSizeInputLabel);
    document.getElementById('options-form')!.appendChild(fetchSizeInput);
    document.getElementById('options-form')!.appendChild(saveButton);
  };

  /** 静的HTMLを生成 */
  await createHTML(); // ボタンの生成が遅くなるとエラーになるのでawaitにする

  /** ボタン押下で設定を保存 */
  document.getElementById('save')!.addEventListener('click', async () => {
    const input: HTMLInputElement = <
      HTMLInputElement // typescriptだと直接valueを参照できないので型付け
    >document.getElementById('fetch-size-input');

    chrome.storage.local.set({ maxResults: input.value });
  });
})();
