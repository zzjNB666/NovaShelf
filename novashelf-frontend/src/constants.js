export const categoryOptions = [
  { value: '互动剧本', label: '互动剧本' },
  { value: '叙事文本', label: '叙事文本' },
  { value: '视觉设定', label: '视觉设定' },
  { value: '创作工具', label: '创作工具' },
  { value: '声音素材', label: '声音素材' },
  { value: '灵感备忘', label: '灵感备忘' }
];

export const categories = categoryOptions.map((item) => item.value);

export function getCategoryLabel(value) {
  return categoryOptions.find((item) => item.value === value)?.label || value || '灵感备忘';
}
