import {Ora} from 'ora'

export function stopAndPersistSpinner(text: string, spinner: Ora): void {
  spinner.stopAndPersist({
    symbol: '✔',
    text,
  });
}

export function changeSpinnerText(text: string, spinner: Ora): void {
  spinner.text = text;
}
