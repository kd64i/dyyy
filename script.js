// 智能提取抖音链接
        function extractDouyinUrl(text) {
            // 修改后的短链接正则表达式，支持短横线
            const shortLinkRegex = /https?:\/\/v\.douyin\.com\/[-\w]+\/?/i;
            const shortLinkMatch = text.match(shortLinkRegex);
            if (shortLinkMatch) {
                return shortLinkMatch[0];
            }
            
            // 长链接正则表达式也需要支持短横线
            const longLinkRegex = /https?:\/\/(www\.)?douyin\.com\/video\/[-\w]+\/?/i;
            const longLinkMatch = text.match(longLinkRegex);
            if (longLinkMatch) {
                return longLinkMatch[0];
            }
            
            // 尝试匹配抖音分享口令中的链接部分
            const shareTextRegex = /https?:\/\/[^\s]+/i;
            const shareTextMatch = text.match(shareTextRegex);
            if (shareTextMatch) {
                return shareTextMatch[0];
            }
            
            // 尝试匹配纯数字ID
            const idRegex = /\d{10,}/;
            const idMatch = text.match(idRegex);
            if (idMatch) {
                return idMatch[0];
            }
            
            // 如果都没有匹配到，返回原始文本
            return text;
        }
        
        async function parseVideo() {
            const inputText = document.getElementById('video-url').value.trim();
            const loading = document.getElementById('loading');
            const result = document.getElementById('result');
            const errorMessage = document.getElementById('error-message');
            const resultContainer = document.getElementById('result-container');
            const imageGallery = document.getElementById('image-gallery');
            const imageGrid = document.getElementById('image-grid');
            
            // 清空之前的结果
            errorMessage.style.display = 'none';
            resultContainer.innerHTML = '';
            imageGrid.innerHTML = '';
            imageGallery.classList.remove('active');
            
            if (!inputText) {
                showError('请输入抖音分享链接或口令');
                return;
            }
            
            // 智能提取链接
            const videoUrl = extractDouyinUrl(inputText);
            
            // 显示加载动画
            loading.classList.add('active');
            result.classList.remove('active');
            
            try {
                // 调用后端API
                const response = await fetch('https://jn12.top/parse.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: 'url=' + encodeURIComponent(videoUrl)
                });
                
                const data = await response.json();
                
                // 隐藏加载动画
                loading.classList.remove('active');
                
                if (data.success) {
                    // 显示结果区域
                    result.classList.add('active');
                    
                    // 生成结果HTML
                    let html = `
                        <div class="result-info">
                            <div class="result-item">
                                <div class="result-label">作者</div>
                                <div class="result-value">${data.author || '未知作者'}</div>
                            </div>
                            <div class="result-item">
                                <div class="result-label">标题</div>
                                <div class="result-value">${data.title || '未知标题'}</div>
                            </div>
                            <div class="result-item">
                                <div class="result-label">视频ID</div>
                                <div class="result-value">${data.video_id || '未知ID'}</div>
                            </div>
                        </div>
                    `;
                    
                    // 根据内容类型显示不同的下载区域
                    if (data.type === 'video') {
                        // 视频：显示视频下载按钮
                        html += `
                            <div class="action-buttons">
                                <a href="${data.video_url}" class="download-btn" download target="_blank">
                                    📥 下载视频
                                </a>
                                <a href="javascript:void(0)" class="download-btn copy-btn" onclick="copyToClipboard('${data.video_url}')">
                                    📋 复制链接
                                </a>
                            </div>
                        `;
                    } else if (data.type === 'image' && data.images && data.images.length > 0) {
                        // 图集：显示图片下载按钮，并展示所有图片
                        imageGallery.classList.add('active');
                        
                        // 添加图片到网格
                        data.images.forEach((imgUrl, index) => {
                            const imageItem = document.createElement('div');
                            imageItem.className = 'image-item';
                            
                            const img = document.createElement('img');
                            img.src = imgUrl;
                            img.alt = `图集图片 ${index + 1}`;
                            img.onerror = function() {
                                this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><rect width="150" height="150" fill="%23eee"/><text x="50%" y="50%" font-family="Arial" font-size="14" fill="%23999" text-anchor="middle" dy=".3em">图片加载失败</text></svg>';
                            };
                            
                            const downloadBtn = document.createElement('a');
                            downloadBtn.href = imgUrl;
                            downloadBtn.className = 'image-download-btn';
                            downloadBtn.download = `douyin_image_${index + 1}.jpg`;
                            downloadBtn.title = "下载图片";
                            downloadBtn.innerHTML = '↓';
                            
                            imageItem.appendChild(img);
                            imageItem.appendChild(downloadBtn);
                            imageGrid.appendChild(imageItem);
                        });
                        
                        // 图集：显示下载和复制链接按钮（与视频类型保持一致）
                        html += `
                            <div class="action-buttons">
                                <a href="${data.video_url}" class="download-btn" download target="_blank">
                                    📥 下载音乐
                                </a>
                                <a href="javascript:void(0)" class="download-btn copy-btn" onclick="copyToClipboard('${data.video_url}')">
                                    📋 复制链接
                                </a>
                            </div>
                        `;
                        
                        // 显示图集数量统计
                        html += `<div style="text-align: center; color: #666; margin-top: 10px;">共 ${data.images.length} 张图片</div>`;
                    } else {
                        showError('未找到可下载的内容');
                    }
                    
                    resultContainer.innerHTML = html;
                } else {
                    showError('解析失败: ' + (data.error || '未知错误'));
                }
            } catch (error) {
                loading.classList.remove('active');
                showError('网络请求失败: ' + error.message);
            }
        }
        
        function showError(message) {
            const errorMessage = document.getElementById('error-message');
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            
            // 3秒后自动隐藏错误消息
            setTimeout(() => {
                errorMessage.style.display = 'none';
            }, 3000);
        }
        
        function copyToClipboard(text) {
            // 检查text是否有效
            if (!text) {
                alert('没有可复制的链接');
                return;
            }
            
            // 使用现代剪贴板API
            navigator.clipboard.writeText(text).then(() => {
                // 显示成功提示
                const successMsg = document.createElement('div');
                successMsg.textContent = '✅ 已复制到剪贴板';
                successMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white; padding: 10px 20px; border-radius: 5px; z-index: 1000;';
                document.body.appendChild(successMsg);
                
                setTimeout(() => {
                    document.body.removeChild(successMsg);
                }, 2000);
            }).catch(err => {
                console.error('复制失败: ', err);
                // 备用方法
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                alert('已复制到剪贴板');
            });
        }
        
        function downloadAllImages() {
            const downloadLinks = document.querySelectorAll('.image-download-btn');
            if (downloadLinks.length === 0) {
                alert('没有找到可下载的图片');
                return;
            }
            
            if (confirm(`确认要下载 ${downloadLinks.length} 张图片吗？`)) {
                // 模拟批量下载（由于浏览器限制，无法真正批量下载）
                // 提示用户手动点击每张图片的下载按钮
                const message = document.createElement('div');
                message.innerHTML = `🎯 共有 ${downloadLinks.length} 张图片，请逐一点击每张图片右下角的下载按钮进行下载。`;
                message.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #2196F3; color: white; padding: 15px 20px; border-radius: 5px; z-index: 1000; text-align: center;';
                document.body.appendChild(message);
                
                setTimeout(() => {
                    document.body.removeChild(message);
                }, 5000);
            }
        }
        
        // 按回车键触发解析
        document.getElementById('video-url').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                parseVideo();
            }
        });
        
        // 如果页面URL有参数，自动填充输入框
        window.addEventListener('DOMContentLoaded', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const urlParam = urlParams.get('url');
            if (urlParam) {
                document.getElementById('video-url').value = decodeURIComponent(urlParam);
                // 自动解析
                setTimeout(parseVideo, 500);
            }
        });